// LegalPage.jsx — shared layout for /privacy-policy, /terms and /cookie-policy.
// The copy lives in the legal-* i18n namespaces (en + hi) so a policy reads the
// same in both languages; this file only knows how to lay a document out.

import { Fragment, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../new-website.css";
import TopBar from "../components/TopBar";
import Navbar from "../components/Navbar";
import PageHead from "../components/PageHead";
import Footer from "../components/Footer";
import { CookieConsentBar } from "@/components/landing/CookieConsentBar";

// "**Term:** rest" → bold lead-in, used by the definition and cookie lists.
const Rich = ({ text }) => {
  const m = /^\*\*(.+?)\*\*\s*(.*)$/s.exec(text);
  return m ? <><strong>{m[1]}</strong> {m[2]}</> : text;
};

const Card = ({ card, labels }) => (
  <div className="nw-legal__card">
    <strong>{card.title}</strong>
    {card.lines.map(line => <p key={line}>{line}</p>)}
    {card.email && (
      <p>{labels.email}: <a href={`mailto:${card.email}`}>{card.email}</a></p>
    )}
    {card.website && (
      <p>{labels.website}: <a href={card.website} target="_blank" rel="noopener noreferrer">{card.website}</a></p>
    )}
  </div>
);

const Block = ({ block, labels }) => {
  if (block.p) return <p><Rich text={block.p} /></p>;
  if (block.note) return <p className="nw-legal__note">{block.note}</p>;
  if (block.h3) return <h3>{block.h3}</h3>;
  if (block.ul) return <ul>{block.ul.map(item => <li key={item}><Rich text={item} /></li>)}</ul>;
  if (block.card) return <Card card={block.card} labels={labels} />;
  if (block.mail) {
    const { text, address, subject } = block.mail;
    return (
      <p>
        {text}{" "}
        <a href={`mailto:${address}?subject=${encodeURIComponent(subject)}`}>{address}</a>.
      </p>
    );
  }
  return null;
};

const LegalPage = ({ ns, id }) => {
  const { i18n } = useTranslation(ns);
  // The whole document is one resource tree, so read the bundle directly;
  // English is the fallback while a Hindi bundle is still loading.
  const doc = i18n.getResourceBundle(i18n.language, ns) ?? i18n.getResourceBundle("en", ns);
  const { sections, intro, footer } = doc;
  const labels = { email: doc.emailLabel, website: doc.websiteLabel };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <>
    <div className="nw-root" id="nw-root">
      <TopBar />
      <Navbar />
      <main>
        <PageHead id={`${id}-head`} title={doc.title} lead={doc.updated} />
        <article className="nw-legal" id={id}>
          <div className="nw-legal__container">
            {intro.map(text => <p key={text}>{text}</p>)}
            {sections.map(section => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.blocks.map((block, i) => <Block key={i} block={block} labels={labels} />)}
              </section>
            ))}

            <p className="nw-legal__see">
              {footer.before}{" "}
              {footer.links.map((link, i) => (
                <Fragment key={link.to}>
                  {i > 0 && ` ${footer.and} `}
                  <Link to={link.to}>{link.label}</Link>
                </Fragment>
              ))}
              {footer.after ? ` ${footer.after}` : "."}
            </p>
            <p><Link to="/">{doc.back}</Link></p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
    {/* Outside .nw-root so the site's resets don't strip its Tailwind styling */}
    <CookieConsentBar />
    </>
  );
};

export default LegalPage;
