// ContactSteps.jsx — /new-website/contact
// "What happens next" — the four steps between sending the form and going
// live, so nobody has to wonder what they just signed up for.
//
// NOTE: this copy is new and has not been signed off. Check the promised
// response time against what the team actually commits to.

import { Send, PhoneCall, MonitorPlay, Rocket } from "lucide-react";

const steps = [
  {
    id: "nw-step-send",
    Icon: Send,
    title: "You send the enquiry",
    desc: "Tell us about your institution and what you would like to see.",
  },
  {
    id: "nw-step-call",
    Icon: PhoneCall,
    title: "We get in touch",
    desc: "Someone from the team calls you, usually within one working day.",
  },
  {
    id: "nw-step-demo",
    Icon: MonitorPlay,
    title: "A guided demo",
    desc: "A walkthrough of the modules that matter to your institution.",
  },
  {
    id: "nw-step-live",
    Icon: Rocket,
    title: "Onboarding",
    desc: "Data migration, staff training and support through go-live.",
  },
];

const ContactSteps = () => {
  return (
    <section className="nw-steps" id="nw-contact-steps">
      <div className="nw-steps__container">

        <h2 className="nw-steps__heading">What Happens Next</h2>

        <ol className="nw-steps__list">
          {steps.map(({ id, Icon, title, desc }, i) => (
            <li className="nw-steps__step" key={id} id={id}>
              <span className="nw-steps__marker" aria-hidden="true">
                <span className="nw-steps__icon">
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <span className="nw-steps__num">{i + 1}</span>
              </span>
              <h3 className="nw-steps__title">{title}</h3>
              <p className="nw-steps__desc">{desc}</p>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
};

export default ContactSteps;
