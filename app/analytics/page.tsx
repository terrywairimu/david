"use client"

import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, BarChart } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"

const AnalyticsPage = () => {
  // Mock data for demonstration
  const metrics = [
    {
      title: "Revenue",
      value: "$45,231",
      change: "+20.1%",
      trend: "up",
      iconType: "dollar",
      color: "text-success",
    },
    {
      title: "New Clients",
      value: "23",
      change: "+15.3%",
      trend: "up",
      iconType: "users",
      color: "text-info",
    },
    {
      title: "Orders",
      value: "156",
      change: "-2.4%",
      trend: "down",
      iconType: "cart",
      color: "text-warning",
    },
    {
      title: "Stock Items",
      value: "89",
      change: "+5.2%",
      trend: "up",
      iconType: "package",
      color: "text-primary",
    },
  ]

  const renderIcon = (iconType: string, size: number, className: string) => {
    switch (iconType) {
      case "dollar":
        return <DollarSign size={size} className={className} />
      case "users":
        return <Users size={size} className={className} />
      case "cart":
        return <ShoppingCart size={size} className={className} />
      case "package":
        return <Package size={size} className={className} />
      default:
        return <BarChart size={size} className={className} />
    }
  }

  return (
    <div id="analyticsSection">
      {/* Header Card */}
      <div className="card mb-4">
        <SectionHeader 
          title="Analytics" 
          icon={<BarChart size={20} />}
        />
        <div className="card-body">
          {/* Key Metrics */}
          <div className="row mb-4">
            {metrics.map((metric, index) => (
              <div key={index} className="col-md-3">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-muted small">{metric.title}</p>
                        <h4 className="mb-1">{metric.value}</h4>
                        <div className="d-flex align-items-center">
                          {metric.trend === "up" ? (
                            <TrendingUp size={16} className="text-success me-1" />
                          ) : (
                            <TrendingDown size={16} className="text-danger me-1" />
                          )}
                          <span className={`small ${metric.trend === "up" ? "text-success" : "text-danger"}`}>
                            {metric.change}
                          </span>
                        </div>
                      </div>
                      {renderIcon(metric.iconType, 32, metric.color)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Placeholder */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Sales Trend</h5>
                </div>
                <div className="card-body">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "250px", backgroundColor: "#f8f9fa" }}
                  >
                    <p className="text-muted">Sales Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Revenue Distribution</h5>
                </div>
                <div className="card-body">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "250px", backgroundColor: "#f8f9fa" }}
                  >
                    <p className="text-muted">Revenue Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Top Performing Products</h5>
                </div>
                <div className="card-body">
                  <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Sales</th>
                          <th>Revenue</th>
                          <th>Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Kitchen Cabinets</td>
                          <td>45</td>
                          <td>$12,500</td>
                          <td className="text-success">+15%</td>
                        </tr>
                        <tr>
                          <td>Worktops</td>
                          <td>32</td>
                          <td>$8,200</td>
                          <td className="text-success">+8%</td>
                        </tr>
                        <tr>
                          <td>Accessories</td>
                          <td>78</td>
                          <td>$3,450</td>
                          <td className="text-danger">-2%</td>
                        </tr>
                      </tbody>
                    </table>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Recent Activity</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <p className="fw-medium mb-1">New order from Client A</p>
                      <p className="text-muted small mb-0">2 hours ago</p>
                    </div>
                    <div>
                      <p className="fw-medium mb-1">Payment received</p>
                      <p className="text-muted small mb-0">4 hours ago</p>
                    </div>
                    <div>
                      <p className="fw-medium mb-1">Stock updated</p>
                      <p className="text-muted small mb-0">6 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
