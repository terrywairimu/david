"use client"

import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart, BarChart } from "lucide-react"

const AnalyticsPage = () => {
  // Mock data for demonstration
  const metrics = [
    {
      title: "Revenue",
      value: "$45,231",
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "New Clients",
      value: "23",
      change: "+15.3%",
      trend: "up",
      icon: Users,
      color: "text-info",
    },
    {
      title: "Orders",
      value: "156",
      change: "-2.4%",
      trend: "down",
      icon: ShoppingCart,
      color: "text-warning",
    },
    {
      title: "Stock Items",
      value: "89",
      change: "+5.2%",
      trend: "up",
      icon: Package,
      color: "text-primary",
    },
  ]

  return (
    <div id="analyticsSection">
      {/* Header Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h4 className="mb-0">
            <BarChart className="me-2" size={20} />
            Analytics
          </h4>
        </div>
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
                      <metric.icon size={32} className={metric.color} />
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
                  <h5 className="mb-0">Client Growth</h5>
                </div>
                <div className="card-body">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{ height: "250px", backgroundColor: "#f8f9fa" }}
                  >
                    <p className="text-muted">Client Growth Chart Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analytics */}
          <div className="row">
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Top Products</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    {["Product A", "Product B", "Product C"].map((product, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center">
                        <span className="fw-medium">{product}</span>
                        <span className="text-muted">${(Math.random() * 1000).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Top Clients</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    {["Client A", "Client B", "Client C"].map((client, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center">
                        <span className="fw-medium">{client}</span>
                        <span className="text-muted">${(Math.random() * 5000).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
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
