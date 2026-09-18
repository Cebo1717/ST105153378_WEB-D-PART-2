# 360WAVING — Website
**Student:** Z Tembe — ST10515337  
**Module:** WEDE5020 - Web Development (Introduction)  
**Location:** Durban, KwaZulu-Natal  
**GitHub:** https://github.com/Cebo1717/Web-Development_ST10515337

360WAVING is an e-commerce brand website for a beauty, grooming and streetwear business selling wave-care products (durags, wave caps, brushes, pomades, oils, shampoos, and kits), with nationwide delivery across South Africa.

---
## Project Structure
```
├── index.html          Home page
├── PRODUCT.html        Product catalogue (grid of product cards)
├── About.html          Brand story, mission, vision, values
├── Contact.html        Contact details, socials, business hours
├── FAQ.html            Frequently asked questions
├── PROCESS.html        Step-by-step guide to getting 360 waves
├── style.css           Single external stylesheet, linked from every page
└── IMG/                Product and brand imagery
    ├── 360wavinglogo.jpg
    ├── Durag.jpg, WaveCaps.jpg, Brush.jpg etc
    └── screenshots/    Desktop / Tablet / Mobile evidence
```

## Part 1 Feedback - Marks Received

From WEDE5020 Part 1 Marking Rubric:

| Criteria | Mark | Feedback Implied |
|----------|------|------------------|
| Two Proposals [5] | 1/5 | Only 1 proposal submitted before due date |
| Content Research [10] | 5/10 | Content somewhat relevant but incomplete |
| Sitemap / Structure Planning [5] | 1/5 | No / incomplete sitemap provided |
| File/Folder Structure [5] | 5/5 | Well-organised |
| HTML Tags for Layout [10] | 7/10 | Most semantic elements used but minor errors |
| HTML Content Tags [10] | 9/10 | Good use of h1,p,img,a etc |
| Sufficient Content [5] | 3/5 | Relevant but lacked depth |
| Menu/Links Navigation [5] | 4/5 | All links functional but could be improved - some broken/inconsistent casing |
| Comments [5] | 1/5 | Some vague comments, does not explain fully |
| GitHub Commits [5] | 2/5 | Few commits, lacking descriptions |
| README [5] | 2/5 | Incomplete, lacks detail |
| Changelog [5] | 2/5 | Incomplete, lacks detail |
| References [5] | 5/5 | Comprehensive |

**Total Part 1 was strong on proposal goals, but lost marks on documentation and technical hygiene.**

---
## Part 2 — CSS Styling & Responsive Design - What Was Done

### How I Addressed Part 1 Feedback (Required for 8-10 marks in Part 2)

| Date | Section / File | Part 1 Feedback | Change Made in Part 2 |
|------|----------------|-----------------|-----------------------|
| 2026-09-12 | Navigation / All HTML | 4/5 - Navigation mostly functional, inconsistent casing `about.html` vs `About.html` breaks on GitHub Pages, PROCESS.html Home linked to `i.html` | Standardised nav order across all 6 pages: Home, Products, About, Contact, FAQ, How To Get Waves. Fixed all hrefs to match exact file casing (`About.html`, `Contact.html`, `FAQ.html`, `PRODUCT.html`, `PROCESS.html`). Fixed broken `i.html` link. Added active class to current page. |
| 2026-09-13 | File Structure / Sitemap | 1/5 - No sitemap provided | Created logical sitemap: Home (landing) → Products (catalogue) → PROCESS (education) → About/Contact/FAQ (support). Implemented via consistent nav in header of every page. Documented in README Project Structure. |
| 2026-09-13 | Content | 3/5 & 5/10 - Sufficient content but lacked depth | Expanded content: index.html added brand origin story (Durban 2024, imported/fake problem), PRODUCT.html added detailed descriptions, prices, benefits, PROCESS.html added 6-step guide, About.html added mission/vision/values/target audience. Replaced FAQ placeholder answers with real answers. |
| 2026-09-14 | HTML Comments | 1/5 - Vague comments | Added comprehensive HTML comments in all pages explaining header, nav, main, product grid, footer sections. Added CSS section comments (1. Reset, 2. Typography, 3. Layout, 4. Visual, 5. Pseudo, 6. Responsive). |
| 2026-09-15 | External Stylesheet | Part 2 Requirement + Part 1: No external CSS | Created single `style.css` and linked from `<head>` of all six pages with `<link rel="stylesheet" href="style.css">`. Removed ALL inline `style="..."` attributes. Added `<meta charset>` and `<meta name="viewport">` for responsive functionality. |
| 2026-09-16 | GitHub Hygiene | 2/5 - Few commits lacking descriptions | Implemented multiple descriptive commits following conventional commits: feat, fix, docs. See commit history. |
| 2026-09-16 | README & Changelog | 2/5 each | Rewrote README to include project structure, Part 2 implementation details, bug fixes, responsive strategy, and screenshot evidence plan. Rewrote changelog with real dates and mapping to Part 1 feedback. |

### Part 2 Technical Implementation

- **External stylesheet:** `style.css` linked from all pages, with preconnect for Google Fonts.
- **Base styles:** CSS Reset (`box-sizing: border-box`), `:root` CSS variables for brand palette (Wave Black #0b0b0b, Silk Gold #d4af37) and spacing scale (xs-xl), using `rem`/`em`/`%`/`ch`/`clamp()`.
- **Typography:** Two-font system - `Bebas Neue` for h1/h2/h3 (streetwear poster feel) and `Work Sans` for body (readability). Defined scale with `clamp(2rem, 5vw, 2.75rem)` for h1, line-height 1.65, letter-spacing.
- **Layout:** Flexbox for header (`flex-direction: column, align-items: center`), nav (`flex-wrap: wrap, justify-content: center, gap`), footer. CSS Grid for `.product-grid` (`repeat(3,1fr)`) and `.feature-grid` (`repeat(2,1fr)`).
- **Visual styling:** Colour, background, border, border-radius, box-shadow on product cards, price badges, dev-callout.
- **Pseudo-classes:** `:hover`, `:focus`, `:active`, `:focus` with visible outline for accessibility, `::after` for nav underline animation, `:first-child`, `:last-child`, `:nth-child` on grids.
- **Responsive:** Two breakpoints: `900px` tablet (3→2 cols, feature grid 1 col), `600px` mobile (nav vertical column, grids 1 col, html font-size 93.75%, header h1 column). Images `max-width:100%; height:auto`.

### Bug Fixes Made While Implementing Styling
- Fixed broken/inconsistent navigation links: `index.html` and `About.html` linked to lowercase `about.html` / `contact.html`, which breaks on case-sensitive hosting (GitHub Pages).
- Fixed `PROCESS.html`'s Home link, which pointed to non-existent `i.html`.
- Added missing PROCESS.html link to nav on all pages.
- Removed inline styles and moved to external stylesheet.

---
## Changelog - Detailed Record of Development

| Date | Change Description |
|------|--------------------|
| 2026-09-12 | Created `style.css` external stylesheet, defined :root variables for colours and spacing, added CSS reset |
| 2026-09-12 | Linked stylesheet to all 6 HTML files, added viewport meta tag, removed inline styles |
| 2026-09-13 | Implemented typography scale Bebas Neue + Work Sans, added clamp() responsive sizes |
| 2026-09-13 | Built Flexbox layouts for header, nav, footer with gap and alignment |
| 2026-09-14 | Built CSS Grid for product catalogue (3 cols) and homepage feature list (2 cols) |
| 2026-09-14 | Added comprehensive HTML comments and CSS section comments for rubric Comments criteria |
| 2026-09-15 | Added pseudo-classes: nav hover/focus/active with ::after underline, card hover lift, button hover, focus outline |
| 2026-09-15 | Added responsive: tablet breakpoint 900px collapses grids, mobile breakpoint 600px stacks nav vertically |
| 2026-09-16 | Fixed nav bugs: casing, broken i.html, missing PROCESS link - addresses Part 1 Menu/Links feedback 4/5 → 5/5 |
| 2026-09-16 | Expanded content depth - addresses Part 1 Sufficient Content 3/5 → 5/5 and Content Research 5/10 → 8/10 |
| 2026-09-18 | Tested on desktop (1280px), tablet (768px), mobile (375px) - added screenshots to IMG/screenshots/ |

---
## References

- MDN Web Docs. *CSS Flexible Box Layout*. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout
- MDN Web Docs. *CSS Grid Layout*. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- MDN Web Docs. *Using media queries*. https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries
- MDN Web Docs. *:hover pseudo-class*. https://developer.mozilla.org/en-US/docs/Web/CSS/:hover
- MDN Web Docs. *CSS Custom Properties*. https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- Google Fonts. *Bebas Neue*. https://fonts.google.com/specimen/Bebas+Neue
- Google Fonts. *Work Sans*. https://fonts.google.com/specimen/Work+Sans
- W3C. *CSS Variables*. https://www.w3.org/TR/css-variables-1/


SRC
