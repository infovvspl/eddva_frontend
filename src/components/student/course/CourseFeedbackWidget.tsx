import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmitBatchFeedback } from "@/hooks/use-admin";
import { toast } from "sonner";

export default function CourseFeedbackWidget({ batchId }: { batchId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitFeedback = useSubmitBatchFeedback();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    try {
      await submitFeedback.mutateAsync({
        batchId,
        data: { rating, comment }
      });
      toast.success("Thank you for your feedback!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div 
              onClick={() => setIsOpen(true)}
              className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-200 rounded-full px-6 py-3 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">Rate this course</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Course Feedback</h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-medium text-slate-500">How would you rate this course?</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Additional Comments (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or what could be improved..."
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-400 focus:bg-white outline-none resize-none transition-colors"
                  />
                  <p className="text-[10px] text-slate-400">Your feedback will be submitted anonymously to the teacher.</p>
                </div>

                <Button 
                  onClick={handleSubmit} 
                  disabled={rating === 0 || submitFeedback.isPending} 
                  className="w-full gap-2 rounded-xl"
                >
                  {submitFeedback.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
