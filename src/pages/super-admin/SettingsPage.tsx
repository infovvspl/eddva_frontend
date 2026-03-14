import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Globe, Shield, Bell, CreditCard, Palette, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("general");

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <PageHeader title="Platform Settings" subtitle="Configure APEXIQ platform settings" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Nav */}
        <div className="card-surface p-2">
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === "general" && (
            <div className="card-surface p-5 space-y-5">
              <h3 className="font-semibold text-foreground">General Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Platform Name</label>
                  <input
                    defaultValue="APEXIQ"
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Support Email</label>
                  <input
                    defaultValue="support@apexiq.in"
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Default Trial Days</label>
                  <input
                    type="number" defaultValue={14}
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Max Institutes</label>
                  <input
                    type="number" defaultValue={200}
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Feature Toggles</h4>
                {[
                  { label: "Battle Arena", desc: "Enable battle mode for students", enabled: true },
                  { label: "AI Doubt Resolution", desc: "Auto-answer student doubts with AI", enabled: true },
                  { label: "Study Plan AI", desc: "AI-generated personalized study plans", enabled: true },
                  { label: "Maintenance Mode", desc: "Show maintenance page to all users", enabled: false },
                ].map((toggle) => (
                  <div key={toggle.label} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{toggle.label}</p>
                      <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                    </div>
                    <button
                      className={`w-10 h-6 rounded-full transition-colors ${
                        toggle.enabled ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-foreground rounded-full transition-transform mx-1 ${
                        toggle.enabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "branding" && (
            <div className="card-surface p-5 space-y-5">
              <h3 className="font-semibold text-foreground">Branding Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tagline</label>
                  <input
                    defaultValue="Fight. Learn. Rank."
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary border border-border" />
                    <input
                      defaultValue="#F97316"
                      className="flex-1 h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:border-primary outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Logo</label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-background">
                  <Palette className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drop logo here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">SVG or PNG, max 2MB</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="card-surface p-5 space-y-5">
              <h3 className="font-semibold text-foreground">Notification Settings</h3>
              <div className="space-y-3">
                {[
                  { label: "New Institute Signup", desc: "Get notified when a new institute registers", enabled: true },
                  { label: "Payment Failed", desc: "Alert when an institute payment fails", enabled: true },
                  { label: "High Error Rate", desc: "Alert when platform error rate exceeds 1%", enabled: true },
                  { label: "Daily Summary", desc: "Receive daily platform summary email", enabled: false },
                  { label: "Weekly Report", desc: "Detailed weekly analytics report", enabled: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button
                      className={`w-10 h-6 rounded-full transition-colors ${item.enabled ? "bg-primary" : "bg-border"}`}
                    >
                      <div className={`w-4 h-4 bg-foreground rounded-full transition-transform mx-1 ${
                        item.enabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="card-surface p-5 space-y-5">
              <h3 className="font-semibold text-foreground">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Session Timeout (minutes)</label>
                  <input
                    type="number" defaultValue={60}
                    className="w-full max-w-xs h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Max Login Attempts</label>
                  <input
                    type="number" defaultValue={5}
                    className="w-full max-w-xs h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Two-Factor Authentication", desc: "Require 2FA for admin accounts", enabled: true },
                    { label: "IP Whitelisting", desc: "Restrict super admin access by IP", enabled: false },
                    { label: "Rate Limiting", desc: "Enable API rate limiting", enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-background rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        className={`w-10 h-6 rounded-full transition-colors ${item.enabled ? "bg-primary" : "bg-border"}`}
                      >
                        <div className={`w-4 h-4 bg-foreground rounded-full transition-transform mx-1 ${
                          item.enabled ? "translate-x-4" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          )}

          {activeSection === "billing" && (
            <div className="card-surface p-5 space-y-5">
              <h3 className="font-semibold text-foreground">Billing Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Gateway</label>
                  <select className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none">
                    <option>Razorpay</option>
                    <option>Stripe</option>
                    <option>PhonePe Business</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Currency</label>
                  <select className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none">
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">GST Number</label>
                  <input
                    defaultValue="29AABCU9603R1ZM"
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Invoice Prefix</label>
                  <input
                    defaultValue="APX"
                    className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button><Save className="w-4 h-4" /> Save Changes</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
