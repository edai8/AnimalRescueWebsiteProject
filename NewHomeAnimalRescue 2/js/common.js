"use strict";

// Shared site info
const COMPANY_NAME = "New Home Animal Rescue";
const COMPANY_SLOGAN = "Every companion deserves a loving home";

// Build the shared navigation, banner, and footer
function renderSharedLayout(activePage)
{
  const nav = document.querySelector("#site-nav");
  const banner = document.querySelector("#site-banner");
  const footer = document.querySelector("#site-footer");

  if (nav)
  {
    const links = 
    [
      { label: "Home", href: "/", page: "home" },
      { label: "Browse Pets", href: "/browse", page: "browse" },
      { label: "View Applications", href: "/applications", page: "applications" },
      { label: "About Us", href: "/about", page: "about" }
    ];

    nav.replaceChildren();

    const inner = document.createElement("div");
    inner.className = "nav-inner";

    const brand = document.createElement("a");
    brand.className = "nav-brand";
    brand.href = "/";
    brand.textContent = COMPANY_NAME;

    const linkContainer = document.createElement("div");
    linkContainer.className = "nav-links";

    links.forEach(link =>
    {
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.label;

      if (link.page === activePage)
      {
        anchor.className = "active";
        anchor.setAttribute("aria-current", "page");
      }

      linkContainer.appendChild(anchor);
    });

    inner.append(brand, linkContainer);
    nav.appendChild(inner);
  }

  if (banner)
  {
    banner.replaceChildren();

    const content = document.createElement("div");
    content.className = "banner-content";

    const tag = document.createElement("span");
    tag.className = "banner-tag";
    tag.textContent = "Rescue. Love. Belong.";

    const heading = document.createElement("h1");
    heading.textContent = COMPANY_NAME;

    const slogan = document.createElement("p");
    slogan.textContent = COMPANY_SLOGAN;

    content.append(tag, heading, slogan);
    banner.appendChild(content);
  }

  if (footer)
  {
    footer.replaceChildren();

    const copyright = document.createElement("p");
    copyright.textContent = `© 2026 ${COMPANY_NAME}`;

    const slogan = document.createElement("p");
    slogan.className = "footer-slogan";
    slogan.textContent = COMPANY_SLOGAN;

    footer.append(copyright, slogan);
  }
}

// CAD dollars
function formatMoney(amount)
{
  return new Intl.NumberFormat("en-CA",
  {
    style: "currency",
    currency: "CAD"
  }).format(amount);
}

// Convert a pet type into browse categories
function getPetCategory(type)
{
  const normalized = String(type).trim().toLowerCase();

  if (["cat", "cats"].includes(normalized))
  {
    return "Cats";
  }

  if (["dog", "dogs"].includes(normalized))
  {
    return "Dogs";
  }

  if 
  (
    ["bird", "birds", "parrot", "parrots", "budgie", "budgies"]
      .includes(normalized)
  )
  {
    return "Birds";
  }

  if (["reptile", "reptiles"].includes(normalized))
  {
    return "Reptiles";
  }

  return "Other";
}

// Display an age
function getPetAge(age)
{
  return `${age} ${age === 1 ? "year" : "years"} old`;
}

// Escape text before inserting data into HTML templates
function escapeHTML(value)
{
  return String(value).replace(/[&<>"']/g, character =>
  {
    const entities =
    {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}