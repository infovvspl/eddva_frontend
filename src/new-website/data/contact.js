// Contact details, shared by the footer and the contact page so the two can
// never disagree.
//
// EDDVA runs two mailboxes, split by vertical — schools and coaching
// institutes. `vertical` matches the backend's LeadVertical enum, which is how
// the contact form picks the right address to fall back to when a submission
// fails.
//
// These replaced the single info@eddva.com the site used to publish; note the
// domain is .in, not .com.

export const emails = [
  {
    id: "school",
    vertical: "SCHOOL",
    address: "school@eddva.in",
    label: "For schools",
  },
  {
    id: "coaching",
    vertical: "COACHING",
    address: "coaching@eddva.in",
    label: "For coaching & institutes",
  },
];

/** The mailbox for a LeadVertical, or the schools one when nothing is implied. */
export const emailFor = vertical =>
  emails.find(e => e.vertical === vertical) || emails[0];

export const PHONE = { display: "+91 79780 73201", href: "tel:+917978073201" };
export const ADDRESS = "Bhubaneswar, Odisha, India";
export const HOURS = "Monday to Saturday, 10am – 7pm";
