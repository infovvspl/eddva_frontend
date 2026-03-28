import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./index-landing.css";

const slides = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&auto=format&fit=crop&q=80",
];

const tickerItems = [
  "AI Assessment Engine",
  "24x7 Doubt Clearing",
  "Career Roadmap AI",
  "Live Lecture Q&A",
  "AI Mock Interviews",
  "ATS Resume Builder",
  "30-Day Learning Cycle",
  "Bilingual Support",
  "Notes AI Assistant",
  "AI Proctoring",
  "Pattern Detection",
  "Weak Topic Recovery",
];

const serviceCards = [
  {
    num: "01",
    icon: "🧠",
    iconBg: "rgba(26,86,255,0.12)",
    title: "AI Assessment Engine",
    description:
      "Auto question generation, intelligent evaluation, mistake pattern detection, and plagiarism scanning.",
  },
  {
    num: "02",
    icon: "💬",
    iconBg: "rgba(24,184,114,0.1)",
    title: "24x7 AI Doubt Clearing",
    description:
      "Always-on bilingual chatbot resolves curriculum doubts in real time - General or Contextual mode.",
  },
  {
    num: "03",
    icon: "🎯",
    iconBg: "rgba(212,145,58,0.12)",
    title: "College Career Module",
    description:
      "AI-generated career roadmaps, mock interviews, skill sequencing, and ATS resume optimisation.",
  },
  {
    num: "04",
    icon: "📅",
    iconBg: "rgba(155,111,255,0.1)",
    title: "Personalised Learning",
    description:
      "30-day AI cycles that identify weak topics and auto-generate custom timetables with curated resources.",
  },
  {
    num: "05",
    icon: "📡",
    iconBg: "rgba(255,107,107,0.1)",
    title: "Live Lecture Intelligence",
    description:
      "AI-assisted Q&A, real-time attendance tracking, and post-lecture transcripts for every session.",
  },
  {
    num: "06",
    icon: "🛡️",
    iconBg: "rgba(0,191,255,0.1)",
    title: "AI Proctoring",
    description: "Intelligent exam monitoring that detects anomalies and ensures academic integrity at any scale.",
  },
];

const footerColumns = [
  {
    title: "Platform",
    links: ["AI Assessment", "Doubt Chatbot", "Career Module", "Live Lectures", "AI Proctoring"],
  },
  {
    title: "Company",
    links: ["About EdVa", "Careers", "Blog", "Press"],
  },
  {
    title: "Contact",
    links: ["Book a Demo", "Partner With Us", "Support", "Privacy Policy"],
  },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startTimer = () => {
      intervalRef.current = window.setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5500);
    };

    startTimer();

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => {
              entry.target.classList.add("on");
            }, index * 65);
          }
        });
      },
      { threshold: 0.1 },
    );

    revealElements.forEach((element) => observer.observe(element));

    const handleScroll = () => {
      const nav = document.querySelector(".edva-nav") as HTMLElement | null;
      if (!nav) return;
      nav.style.borderBottomColor = window.scrollY > 50 ? "rgba(240,237,232,0.13)" : "rgba(240,237,232,0.08)";
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const goToSlide = (index: number) => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentSlide(((index % slides.length) + slides.length) % slides.length);
    intervalRef.current = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
  };

  const tickerLoop = [...tickerItems, ...tickerItems];

  return (
    <div className="edva-landing">
      <nav className="edva-nav">
        <div className="edva-nav-wrap">
          <Link className="edva-logo" to="/">
            <div className="edva-logo-box">E</div>
            <div>
              <span className="edva-logo-name">EdVa</span>
              <span className="edva-logo-sub">Education Plus Advancement</span>
            </div>
          </Link>

          <div className="edva-nav-links">
            <a href="#services">Services</a>
            <a href="#assessment">Assessment</a>
            <a href="#career">Career</a>
            <a href="#learning">Learning</a>
            <a href="#cta">Contact</a>
          </div>

          <button
            className="edva-nav-demo"
            onClick={() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" })}
            type="button"
          >
            Request Demo
          </button>
        </div>
      </nav>

      <section className="edva-hero" id="hero">
        {slides.map((slide, index) => (
          <div
            key={slide}
            className={`edva-slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url('${slide}')` }}
          />
        ))}

        <button className="edva-slide-prev" onClick={() => goToSlide(currentSlide - 1)} type="button">
          &#8592;
        </button>
        <button className="edva-slide-next" onClick={() => goToSlide(currentSlide + 1)} type="button">
          &#8594;
        </button>

        <div className="edva-hero-content">
          <div className="edva-hero-eyebrow">
            <div className="edva-dot-live" />
            <span>India&apos;s First Bilingual AI Education Platform</span>
          </div>
          <h1>
            Smarter Schools.
            <br />
            <em>Brighter</em> Futures.
          </h1>
          <p className="edva-hero-desc">
            EdVa delivers end-to-end AI intelligence to schools &amp; colleges from assessment and doubt clearing to
            career readiness in Hindi and English.
          </p>
          <div className="edva-hero-actions">
            <a className="edva-btn-primary" href="#cta">
              Schedule a Free Demo
            </a>
            <a className="edva-btn-ghost" href="#services">
              Explore Platform &#8594;
            </a>
          </div>
          <div className="edva-hero-stats">
            <div className="edva-hstat">
              <div className="edva-hstat-n">
                6<sup>+</sup>
              </div>
              <div className="edva-hstat-l">AI Modules</div>
            </div>
            <div className="edva-hstat">
              <div className="edva-hstat-n">
                24<sup>/7</sup>
              </div>
              <div className="edva-hstat-l">Doubt Support</div>
            </div>
            <div className="edva-hstat">
              <div className="edva-hstat-n">
                30<sup>d</sup>
              </div>
              <div className="edva-hstat-l">Learning Cycles</div>
            </div>
            <div className="edva-hstat">
              <div className="edva-hstat-n">
                2<sup>Lang</sup>
              </div>
              <div className="edva-hstat-l">Hindi + English</div>
            </div>
          </div>
        </div>

        <div className="edva-slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`edva-ind ${index === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              type="button"
            />
          ))}
        </div>
      </section>

      <div className="edva-ticker">
        <div className="edva-ticker-track">
          {tickerLoop.map((item, index) => (
            <span className="edva-ticker-item" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="edva-services-section" id="services">
        <div className="container">
          <div className="edva-sec-header reveal">
            <span className="edva-section-label">What We Offer</span>
            <h2 className="edva-section-title">
              Six AI-Powered Modules,
              <br />
              One Complete Platform
            </h2>
            <p className="edva-section-desc">
              Every feature is AI-native built to automate, personalise, and elevate every aspect of institutional
              education.
            </p>
          </div>

          <div className="edva-services-grid reveal">
            {serviceCards.map((service) => (
              <div className="edva-svc-card" key={service.num}>
                <span className="edva-svc-num">{service.num}</span>
                <div className="edva-svc-icon" style={{ background: service.iconBg }}>
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="edva-feat-section" id="assessment">
        <div className="container">
          <div className="edva-feat-grid">
            <div className="reveal">
              <div className="edva-feat-label">AI Assessment Engine</div>
              <h2 className="edva-feat-title">
                Intelligent Evaluation,
                <br />
                End to End
              </h2>
              <p className="edva-feat-desc">
                EdVa&apos;s assessment engine automates question creation, marking, and insight generation so teachers
                focus on teaching.
              </p>
              <ul className="edva-feat-list">
                <li>
                  <span className="ic">⚡</span>
                  <div>
                    <strong>Auto Question Generation</strong> - AI creates questions with self-adjusting difficulty
                    based on each student&apos;s history.
                  </div>
                </li>
                <li>
                  <span className="ic">📊</span>
                  <div>
                    <strong>Answer Evaluation &amp; Feedback</strong> - Marks responses, identifies strengths, and
                    suggests targeted improvements.
                  </div>
                </li>
                <li>
                  <span className="ic">🔍</span>
                  <div>
                    <strong>Mistake Pattern Detection</strong> - Tells apart conceptual gaps from calculation errors
                    for root-cause resolution.
                  </div>
                </li>
                <li>
                  <span className="ic">🛡️</span>
                  <div>
                    <strong>Plagiarism &amp; AI-Content Detection</strong> - Ensures academic integrity across all
                    submissions.
                  </div>
                </li>
              </ul>
            </div>

            <div className="edva-panel reveal">
              <div className="edva-panel-bar">
                <div className="edva-pbar-dot" style={{ background: "#E53535" }} />
                <div className="edva-pbar-dot" style={{ background: "#E8A33A" }} />
                <div className="edva-pbar-dot" style={{ background: "#1DC47A" }} />
                <span className="edva-pbar-title">Assessment Dashboard</span>
              </div>
              <div className="edva-panel-body">
                <div className="edva-arow">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>Physics - Wave Optics</div>
                    <div className="edva-arow-lbl">25 questions - Adaptive</div>
                  </div>
                  <span className="edva-chip edva-chip-g">READY</span>
                </div>
                <div className="edva-arow">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>Chemistry - Organic Reactions</div>
                    <div className="edva-arow-lbl">Mixed difficulty - Ongoing</div>
                  </div>
                  <span className="edva-chip edva-chip-a">ONGOING</span>
                </div>
                <div className="edva-arow">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>Plagiarism Scan - Batch 3B</div>
                    <div className="edva-arow-lbl">32 submissions analysed</div>
                  </div>
                  <span className="edva-chip edva-chip-b">SCANNING</span>
                </div>
                <div className="edva-sbar">
                  {[
                    { name: "Rohit M.", score: "78/100", width: "78%", color: "var(--blue)" },
                    { name: "Priya S.", score: "91/100", width: "91%", color: "var(--green)" },
                    { name: "Aryan K.", score: "54/100", width: "54%", color: "var(--amber)" },
                  ].map((student) => (
                    <div className="edva-sbar-row" key={student.name}>
                      <div className="edva-sbar-lbl">
                        <span>{student.name}</span>
                        <span>{student.score}</span>
                      </div>
                      <div className="edva-sbar-track">
                        <div className="edva-sbar-fill" style={{ width: student.width, background: student.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="edva-ai-note">
                  🤖 <strong>AI Insight:</strong> Aryan shows a conceptual gap in Trigonometry, not calculation
                  errors. Recovery module auto-assigned.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="edva-feat-section alt">
        <div className="container">
          <div className="edva-feat-grid flip">
            <div className="reveal">
              <div className="edva-feat-label">24x7 AI Support</div>
              <h2 className="edva-feat-title">
                Doubts Resolved.
                <br />
                Notes Corrected.
                <br />
                Any Time.
              </h2>
              <p className="edva-feat-desc">
                EdVa&apos;s AI chatbot is always available. Students get instant answers and inline note corrections in
                Hindi or English.
              </p>
              <ul className="edva-feat-list">
                <li>
                  <span className="ic">🌙</span>
                  <div>
                    <strong>Always-On</strong> - Resolves curriculum doubts at any hour without waiting.
                  </div>
                </li>
                <li>
                  <span className="ic">📖</span>
                  <div>
                    <strong>Contextual Mode</strong> - Answers doubts inline while reading notes, no tab switching
                    needed.
                  </div>
                </li>
                <li>
                  <span className="ic">🇮🇳</span>
                  <div>
                    <strong>Bilingual</strong> - Understands and replies in Hindi and English simultaneously.
                  </div>
                </li>
                <li>
                  <span className="ic">📝</span>
                  <div>
                    <strong>AI Notes Assistant</strong> - Flags errors, fills incomplete sections, returns corrected
                    notes.
                  </div>
                </li>
                <li>
                  <span className="ic">📈</span>
                  <div>
                    <strong>Doubt Tracking</strong> - Frequent doubts surfaced automatically to teachers.
                  </div>
                </li>
              </ul>
            </div>

            <div className="edva-panel reveal">
              <div className="edva-panel-bar">
                <div className="edva-pbar-dot" style={{ background: "#E53535" }} />
                <div className="edva-pbar-dot" style={{ background: "#E8A33A" }} />
                <div className="edva-pbar-dot" style={{ background: "#1DC47A" }} />
                <span className="edva-pbar-title">EdVa AI Chatbot</span>
              </div>
              <div className="edva-panel-body">
                <div className="edva-chat-msg b">
                  <span className="edva-bname">EDVA AI</span>
                  नमस्ते! 👋 Ask me anything in Hindi or English. I&apos;m here 24/7.
                </div>
                <div className="edva-chat-msg u">Newton&apos;s third law को simple way में explain करो</div>
                <div className="edva-chat-msg b">
                  <span className="edva-bname">EDVA AI</span>
                  हर action के लिए equal और opposite reaction होता है। जब आप दीवार को push करते हैं, दीवार भी आपको
                  equal force से push करती है। 🔄
                </div>
                <div className="edva-chat-msg u">Can you check my notes on this?</div>
                <div className="edva-panel" style={{ marginBottom: "8px" }}>
                  <div className="edva-typing">
                    <div className="edva-td" />
                    <div className="edva-td" />
                    <div className="edva-td" />
                  </div>
                </div>
                <div className="edva-notes-ok">
                  📋 Notes scan complete - 1 error flagged, 2 sections incomplete. Corrected version ready.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="edva-feat-section" id="career">
        <div className="container">
          <div className="edva-feat-grid">
            <div className="reveal">
              <div className="edva-feat-label">College Career Module</div>
              <h2 className="edva-feat-title">
                From Classroom to Career -
                <br />
                AI Guides Every Step
              </h2>
              <p className="edva-feat-desc">
                EdVa maps each student&apos;s academic profile to real career pathways and provides structured guidance
                through every milestone.
              </p>
              <ul className="edva-feat-list">
                <li>
                  <span className="ic">🗺️</span>
                  <div>
                    <strong>Career Roadmap Generation</strong> - Maps profiles to career options with alternative
                    pathways.
                  </div>
                </li>
                <li>
                  <span className="ic">📚</span>
                  <div>
                    <strong>Step-by-Step Guidance</strong> - Sequences skills, certifications, and projects in the
                    right order.
                  </div>
                </li>
                <li>
                  <span className="ic">🎤</span>
                  <div>
                    <strong>AI Mock Interviews</strong> - Role-specific simulations with answer feedback and confidence
                    scoring.
                  </div>
                </li>
                <li>
                  <span className="ic">📄</span>
                  <div>
                    <strong>ATS Resume Optimisation</strong> - Analyses resumes and generates ATS-ready versions for
                    top platforms.
                  </div>
                </li>
              </ul>
            </div>

            <div className="edva-panel reveal">
              <div className="edva-panel-bar">
                <div className="edva-pbar-dot" style={{ background: "#E53535" }} />
                <div className="edva-pbar-dot" style={{ background: "#E8A33A" }} />
                <div className="edva-pbar-dot" style={{ background: "#1DC47A" }} />
                <span className="edva-pbar-title">Career Roadmap - Priya S.</span>
              </div>
              <div className="edva-panel-body">
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--amber-dim)",
                    border: "1px solid rgba(212,145,58,0.25)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    marginBottom: "14px",
                    color: "var(--amber)",
                  }}
                >
                  🎯 AI Match: <strong>Data Science → ML Engineering</strong> - B.Sc Maths + Python interest
                </div>
                {[
                  ["1", "Python & Statistics", "Coursera - 6 weeks - Free track"],
                  ["2", "3 Portfolio Projects", "Kaggle datasets - AI-guided builds"],
                  ["3", "AI Mock Interview", "Data Analyst role - Confidence: 74%"],
                  ["4", "ATS Resume Generated", "Optimised for Flipkart, Swiggy, Razorpay"],
                ].map(([step, title, description]) => (
                  <div className="edva-cstep" key={step}>
                    <div className="edva-cstep-c">{step}</div>
                    <div>
                      <h4>{title}</h4>
                      <p>{description}</p>
                    </div>
                  </div>
                ))}
                <div className="edva-ats">✅ Resume Score: 87/100 - ATS Pass Rate: High</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="edva-cycle-section" id="learning">
        <div className="container">
          <div className="edva-sec-header reveal">
            <span className="edva-section-label">Personalised Learning</span>
            <h2 className="edva-section-title">The 30-Day AI Recovery Cycle</h2>
            <p className="edva-section-desc">
              Identifies weak topics, creates personalised timetables, and curates the right resources every month,
              automatically.
            </p>
          </div>

          <div className="edva-cycle-flow reveal">
            {[
              ["01", "Assessments Taken", "Regular tests across all subjects feed the AI with performance data."],
              ["02", "Data Collected", "Every answer, mistake, and time-taken is tracked and analysed."],
              ["03", "Weak Topics Found", "AI identifies and prioritises gaps by severity and exam relevance."],
              ["04", "Timetable Generated", "A personalised study plan is auto-created with optimal allocation."],
            ].map(([num, title, description], index, array) => (
              <div className="edva-cflow" key={num}>
                {index !== array.length - 1 && <span className="edva-cflow-arr">→</span>}
                <div className="edva-cflow-num">{num}</div>
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>

          <div className="reveal">
            <p className="edva-res-lbl">Curated AI Resources</p>
            <div className="edva-res-grid">
              {[
                ["▶️", "YouTube Videos", "Topic-specific videos from verified educators mapped to weak areas."],
                ["🎓", "Free Courses", "SWAYAM, Khan Academy, NPTEL auto-matched to student gaps."],
                ["📄", "Study Notes", "Chapter-wise notes from vetted sources, tailored to identified gaps."],
                ["✏️", "Practice Quizzes", "Adaptive quizzes that progressively strengthen weak areas."],
              ].map(([icon, title, description]) => (
                <div className="edva-res-card" key={title}>
                  <div className="edva-res-icon">{icon}</div>
                  <h4>{title}</h4>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="edva-live-section" id="live">
        <div className="container">
          <div className="edva-sec-header reveal">
            <span className="edva-section-label">Live Lecture Intelligence</span>
            <h2 className="edva-section-title">
              Your Classroom,
              <br />
              Supercharged by AI
            </h2>
            <p className="edva-section-desc">
              AI adds intelligence to every live and recorded session from Q&amp;A to attendance to post-lecture
              transcripts.
            </p>
          </div>

          <div className="edva-live-grid">
            <div className="reveal">
              {[
                ["📡", "Live & Recorded Support", "Full AI functionality for both live and recorded sessions."],
                [
                  "🤖",
                  "AI-Assisted Q&A",
                  "Students ask, AI suggests, Teacher reviews, then approves or customises.",
                ],
                ["👁️", "Real-Time Attendance", "Accurate attendance tracked automatically throughout each session."],
                ["📋", "Post-Lecture Transcript", "Complete Q&A transcripts delivered to all students after class."],
              ].map(([icon, title, description]) => (
                <div className="edva-lfeat" key={title}>
                  <div className="edva-lfeat-ic">{icon}</div>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="edva-stream-wrap reveal">
              <div className="edva-stream-top">
                <span className="edva-live-chip">LIVE</span>
                <span className="edva-slabel">Physics - Electromagnetic Induction</span>
                <span className="edva-viewers">● 142 students attending</span>
              </div>
              <div className="edva-stream-qa">
                <div className="edva-qa-lbl">Live Q&amp;A - AI Assisted</div>
                <div className="edva-qa-row">
                  <div className="edva-qa-from">ROHIT M.</div>
                  What is the difference between EMF and potential difference?
                  <div className="edva-qa-ai">
                    🤖 EMF is energy per unit charge from source; PD is work done moving charge between two points.
                  </div>
                </div>
                <div className="edva-qa-row">
                  <div className="edva-qa-from">SNEHA K.</div>
                  Lenz&apos;s law ka real life example kya hai?
                  <div className="edva-qa-ai">
                    🤖 Electric brakes in trains - opposing currents created by Lenz&apos;s law slow the motion.
                  </div>
                </div>
                <div className="edva-tx-note">✓ Transcript will be sent to all 142 students after lecture ends</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="edva-cta-section" id="cta">
        <span className="edva-section-label">Ready to Transform Your Institution?</span>
        <h2 className="reveal">
          India&apos;s Education Deserves
          <br />
          <em>Intelligent Infrastructure.</em>
        </h2>
        <p className="edva-cta-desc reveal">
          Join schools and colleges already on the waitlist. Get a personalised demo of the full EdVa platform.
        </p>
        <div className="edva-cta-btns reveal">
          <a className="edva-btn-primary" href="#">
            Request a Free Demo
          </a>
          <a className="edva-btn-outline" href="#">
            Talk to Sales
          </a>
        </div>
        <div className="edva-bilingual reveal">🇮🇳 Available in Hindi &amp; English</div>
      </section>

      <footer className="edva-footer">
        <div className="edva-footer-grid">
          <div className="edva-fbrand">
            <Link className="edva-logo" to="/">
              <div className="edva-logo-box">E</div>
              <div>
                <span className="edva-logo-name">EdVa</span>
                <span className="edva-logo-sub">Education Plus Advancement</span>
              </div>
            </Link>
            <p>India&apos;s first end-to-end bilingual AI education platform for schools &amp; colleges.</p>
          </div>

          {footerColumns.map((column) => (
            <div className="edva-fcol" key={column.title}>
              <h5>{column.title}</h5>
              {column.links.map((link) => (
                <a href="#" key={link}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="edva-footer-btm">
          <span>© 2025 EdVa - Education Plus Advancement</span>
          <span>Made in India 🇮🇳</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
