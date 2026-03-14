import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";

const PlaceholderPage = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <PageHeader title={title} subtitle={subtitle || "Coming soon"} />
    <div className="card-surface p-10 text-center">
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  </motion.div>
);

export default PlaceholderPage;
