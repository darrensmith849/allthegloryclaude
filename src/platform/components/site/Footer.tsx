import Link from "@/platform/components/ui/Link";
import { brand } from "@/platform/config/brand";
import { footerNav } from "@/platform/config/navigation";
import { publicEnv } from "@/platform/config/public-env";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo />
            <p>{brand.shortDescription}</p>
            {publicEnv.contactEmail ? (
              <p>
                <a href={`mailto:${publicEnv.contactEmail}`}>{publicEnv.contactEmail}</a>
              </p>
            ) : null}
          </div>
          <nav className="site-footer__nav" aria-label="Footer">
            {footerNav.map((group) => (
              <div key={group.heading}>
                <h2>{group.heading}</h2>
                <ul role="list">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="site-footer__bottom">
          <p>
            © {year} {brand.legalEntity ?? `${brand.name} (operating entity to be confirmed)`}. Founded in {brand.founded}.
          </p>
          <p>
            “{brand.name}” is a working name. Roster profiles and opportunities shown before launch are fictional samples. No partnership or
            representation is implied.
          </p>
        </div>
      </div>
    </footer>
  );
}
