import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, HelpCircle, MessageCircle, BookOpen,
  ChevronDown, ChevronUp, Mail, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FAQ {
  q: string;
  a: string;
}

const faqs: FAQ[] = [
  { q: "How do I add a new fish batch?", a: "Go to the Batches page and tap the + button. Fill in the species, count, pond, and stocking date to create a new batch." },
  { q: "What do the water quality alerts mean?", a: "Water quality alerts trigger when readings fall outside safe ranges. Red alerts indicate critical levels that need immediate attention (e.g., dissolved oxygen below 5 mg/L)." },
  { q: "How is the Feed Conversion Ratio (FCR) calculated?", a: "FCR = Total feed given (kg) ÷ Total weight gained (kg). A lower FCR means better feed efficiency. Tilapia typically ranges 1.2–1.8." },
  { q: "Can I manage my farm with a team?", a: "Yes! With the Pro plan, you can invite team members with different roles (Manager, Worker) from Settings → Team Management." },
  { q: "How do I list fish on the marketplace?", a: "Navigate to the Marketplace page and tap 'Sell'. Fill in the listing details including species, price, and quantity." },
  { q: "What's included in the free plan?", a: "The free plan includes up to 3 ponds, basic water monitoring, health tracking, feeding logs, and financial records. Upgrade to Pro for AI predictions, marketplace access, and team management." },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen">
      <div className="gradient-ocean px-4 pt-10 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="w-8 h-8 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-primary-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-display text-primary-foreground">Help & Support</h1>
            <p className="text-xs text-primary-foreground/70 mt-0.5">FAQs, guides & contact</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-10 space-y-4 pb-4">
        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: "User Guide", desc: "Learn the basics", color: "bg-primary/10 text-primary" },
            { icon: MessageCircle, label: "Contact Us", desc: "Get in touch", color: "bg-secondary/10 text-secondary" },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-2xl shadow-card p-4 flex flex-col items-center text-center gap-2">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" /> Frequently Asked Questions
          </h3>
          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-border/50 last:border-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-3 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-2">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  }
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pb-3"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/50 rounded-xl p-3">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Contact Support
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Need help? Reach out to our support team and we'll get back to you within 24 hours.
          </p>
          <a href="mailto:support@aquasmart.app"
            className="w-full gradient-ocean text-primary-foreground font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" /> Email Support
          </a>
        </motion.div>

        {/* App Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-center py-4">
          <p className="text-xs text-muted-foreground">AquaSmart v1.0.0</p>
          <p className="text-[10px] text-muted-foreground mt-1">Built with ❤️ for fish farmers</p>
        </motion.div>
      </div>
    </div>
  );
}
