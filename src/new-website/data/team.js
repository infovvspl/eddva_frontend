// team.js — "Meet the Team" roster for /about.
// Real founder/team names and photos, sourced from the signed-off copy in
// src/components/landing/about/AboutMarketing.tsx (the "Founder's Message"
// and "Team" sections there) — this is the correct roster, not the earlier
// placeholder one this file used to carry.

import founderPhoto from "../assets/mdcolsir.png";
import ayush from "../assets/team-ayush.png";
import ankit from "../assets/team-ankit.png";
import priyanka from "../assets/team-priyanka.png";
import bhagyashree from "../assets/Bhagyasree.png";
import akankshya from "../assets/team-akankshya.png";
import subham from "../assets/team-subham.png";

export const founder = {
  name: "Lt. Col. Anil Tripathi (Retd.)",
  role: "Founder, EDDVA · Sena Medal Awardee",
  photo: founderPhoto,
  bio: "Lt. Col. Anil Tripathi (Retd.), Sena Medal Awardee, brings a legacy of discipline, leadership and purpose to EDDVA. After a distinguished military career and building Port Translogistics Pvt. Ltd. into a respected enterprise, he recognised a deeper gap — a learning system that lacked adaptability, depth and true understanding. EDDVA was born from that vision: a platform that doesn't just deliver information, but interprets, adapts and empowers.",
  quote: "True growth is not about access to knowledge — it is about mastering it with clarity and intent.",
};

export const team = [
  { id: "nw-team-ankit", name: "Ankit Tripathi", role: "Additional Director", photo: ankit },
  { id: "nw-team-ayush", name: "Ayush Kumar Dubey", role: "Senior JEE Educator", photo: ayush },
  { id: "nw-team-priyanka", name: "Priyanka SV", role: "Marketing Head", photo: priyanka },
  { id: "nw-team-subham", name: "Subham Mishra", role: "Full-Stack AI/ML Developer", photo: subham },
  { id: "nw-team-akankshya", name: "Akankshya Kar", role: "AI/ML Developer", photo: akankshya },
  { id: "nw-team-bhagyashree", name: "Bhagyashree Sendh", role: "Full-Stack Developer", photo: bhagyashree },
];
