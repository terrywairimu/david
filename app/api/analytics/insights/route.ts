import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { summary } = body || {}

    // If OpenAI key is available, call OpenAI directly (simple integration path).
    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      const prompt = `You are an analytics copilot. Given the following business analytics summary, generate:
1) Three short insights (bulleted) with concrete numbers if available.
2) One risk to watch.
3) Two recommended next actions.
Keep it concise and actionable.

Summary JSON:
${JSON.stringify(summary || {}, null, 2)}`

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert analytics assistant." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      })

      if (!resp.ok) {
        const err = await resp.text().catch(() => "")
        throw new Error(`OpenAI error: ${resp.status} ${err}`)
      }

      const data = await resp.json()
      const text = data.choices?.[0]?.message?.content || "No insights generated."
      return NextResponse.json({ insights: text, provider: "openai" })
    }

    // Fallback rule-based insights (no external key)
    const growth = Number(summary?.growthRate || 0)
    const totalRevenue = Number(summary?.revenue || 0)
    const totalProfit = Number(summary?.profit || 0)

    const insights = [
      `Growth rate ${growth >= 0 ? "up" : "down"} ${Math.abs(growth)}%.`,
      `Total revenue ${Intl.NumberFormat().format(totalRevenue)} with profit ${Intl.NumberFormat().format(totalProfit)}.`,
      totalProfit > 0 ? "Unit economics positive; consider scaling top channels." : "Profit negative; prioritize margin improvements.",
    ]

    const risk = growth < 0 ? "Revenue contraction detected; review churn and pricing." : "Growth concentrated in recent month; confirm sustainability."
    const actions = [
      "Run cohort analysis by acquisition channel to find high-LTV segments.",
      "Launch pricing A/B test targeting top-3 SKUs to lift margin 2–4%.",
    ]

    return NextResponse.json({
      insights: `• ${insights.join("\n• ")}\n\nRisk: ${risk}\n\nNext Actions:\n1) ${actions[0]}\n2) ${actions[1]}`,
      provider: "rules",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to generate insights" }, { status: 500 })
  }
}





