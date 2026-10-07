#!/usr/bin/env node

/**
 * Automatic Public URL Index Generator
 *
 * Features:
 * - Scans multiple website directories
 * - Finds all HTML pages
 * - Converts .html URLs to clean URLs
 * - Converts index.html to /
 * - Groups URLs by domain
 * - Groups URLs by brand
 * - Generates:
 *      README.md
 *      domains/*.md
 *      brands/*.md
 *
 * Node.js 18+
 */

const fs = require("fs");
const path = require("path");

/**
 * ============================================================
 * CONFIGURATION
 * ============================================================
 */

const ROOT_DIR = path.resolve(__dirname, "..");

const SITES_DIR = path.join(ROOT_DIR, "sites");
const DOMAINS_DIR = path.join(ROOT_DIR, "domains");
const BRANDS_DIR = path.join(ROOT_DIR, "brands");

const README_FILE = path.join(ROOT_DIR, "README.md");

/**
 * Add/remove domains here.
 *
 * "directory" = folder inside /sites
 * "domain"    = public website domain
 * "name"      = display name
 */
const DOMAINS = [
  {
    directory: "drloveofficial",
    domain: "https://dipakparmar2007.github.io/florencia-barrera-workspace/sites/drloveofficial/",
    name: "Dr. Love Official",
  },
  {
    directory: "robertlove",
    domain: "https://dipakparmar2007.github.io/florencia-barrera-workspace/sites/robertlove/",
    name: "Robert Love",
  },
  {
    directory: "roarlionsmane",
    domain: "https://dipakparmar2007.github.io/florencia-barrera-workspace/sites/roarlionsmane/",
    name: "Roar Lion's Mane",
  },
  {
    directory: "drlovelionsmane",
    domain: "https://dipakparmar2007.github.io/florencia-barrera-workspace/sites/drlovelionsmane/",
    name: "Dr. Love Lion's Mane",
  },
];

/**
 * Brand folders.
 *
 * The script detects the first matching folder in the page path.
 *
 * Example:
 *
 * sites/drloveofficial/michael/about.html
 *
 * becomes:
 *
 * Brand: Michael
 * URL: https://drloveofficial.com/michael/about
 */
const BRANDS = [
  {
    slug: "michael",
    name: "Michael",
  },
  {
    slug: "british-invasion",
    name: "British Invasion",
  },
  {
    slug: "run-media",
    name: "Run Media",
  },
];

/**
 * Files/directories that should NOT be indexed.
 */
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".github",
  "node_modules",
  "assets",
  "css",
  "js",
  "images",
  "image",
  "img",
  "fonts",
  "uploads",
  "vendor",
]);

const EXCLUDED_FILES = new Set([
  "404.html",
  "403.html",
  "500.html",
]);

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function ensureDirectory(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    });
  }
}

function normalizeSlash(value) {
  return value.replace(/\\/g, "/");
}

function titleFromSlug(slug) {
  if (!slug) {
    return "Home";
  }

  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function relativeFileToUrl(relativeFile) {
  let normalized = normalizeSlash(relativeFile);

  /**
   * Remove .html
   */
  normalized = normalized.replace(/\.html$/i, "");

  /**
   * index -> directory root
   *
   * index
   * index/
   */
  normalized = normalized.replace(/(^|\/)index$/i, "$1");

  /**
   * Remove duplicate slashes
   */
  normalized = normalized.replace(/\/+/g, "/");

  /**
   * Remove leading slash
   */
  normalized = normalized.replace(/^\/+/, "");

  /**
   * Remove trailing slash except root
   */
  if (normalized !== "") {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}

function buildPublicUrl(domain, relativeFile) {
  const cleanPath = relativeFileToUrl(relativeFile);

  if (!cleanPath) {
    return `${domain}/`;
  }

  return `${domain}/${cleanPath}`;
}

function findBrand(relativeFile) {
  const parts = normalizeSlash(relativeFile)
    .split("/")
    .filter(Boolean);

  for (const brand of BRANDS) {
    if (parts.includes(brand.slug)) {
      return brand;
    }
  }

  return {
    slug: "dr-love",
    name: "Dr. Love",
  };
}

function shouldExcludeDirectory(name) {
  return EXCLUDED_DIRECTORIES.has(name.toLowerCase());
}

function shouldExcludeFile(name) {
  return EXCLUDED_FILES.has(name.toLowerCase());
}

/**
 * ============================================================
 * FIND HTML FILES
 * ============================================================
 */

function findHtmlFiles(directory) {
  const results = [];

  if (!fs.existsSync(directory)) {
    return results;
  }

  function walk(currentDirectory) {
    const entries = fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (shouldExcludeDirectory(entry.name)) {
          continue;
        }

        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".html")) {
        continue;
      }

      if (shouldExcludeFile(entry.name)) {
        continue;
      }

      results.push(fullPath);
    }
  }

  walk(directory);

  return results.sort();
}

/**
 ============================================================
 * DOMAIN SCANNING
 * ============================================================
 */

function scanDomain(domainConfig) {
  const siteDirectory = path.join(
    SITES_DIR,
    domainConfig.directory
  );

  const files = findHtmlFiles(siteDirectory);

  const pages = files.map((filePath) => {
    const relativeFile = normalizeSlash(
      path.relative(siteDirectory, filePath)
    );

    const url = buildPublicUrl(
      domainConfig.domain,
      relativeFile
    );

    const cleanPath = relativeFileToUrl(relativeFile);

    const brand = findBrand(relativeFile);

    const title =
      cleanPath === ""
        ? "Home"
        : titleFromSlug(
            cleanPath.split("/").pop()
          );

    return {
      domain: domainConfig.domain,
      domainName: domainConfig.name,
      relativeFile,
      url,
      path: cleanPath,
      title,
      brand: brand.name,
      brandSlug: brand.slug,
    };
  });

  /**
   * Remove duplicate URLs.
   */
  const unique = new Map();

  for (const page of pages) {
    unique.set(page.url, page);
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.url.localeCompare(b.url)
  );
}

/**
 ============================================================
 * MARKDOWN TABLE
 ============================================================
 */

function markdownTable(pages) {
  if (!pages.length) {
    return "_No public HTML pages found._\n";
  }

  const rows = [
    "| # | Page | File | Public URL |",
    "|---:|---|---|---|",
  ];

  pages.forEach((page, index) => {
    rows.push(
      `| ${index + 1} | ${page.title} | \`${page.relativeFile}\` | <${page.url}> |`
    );
  });

  return rows.join("\n") + "\n";
}

/**
 ============================================================
 * DOMAIN MARKDOWN
 ============================================================
 */

function generateDomainMarkdown(domainConfig, pages) {
  const brandGroups = new Map();

  for (const page of pages) {
    if (!brandGroups.has(page.brand)) {
      brandGroups.set(page.brand, []);
    }

    brandGroups.get(page.brand).push(page);
  }

  let output = "";

  output += `# ${domainConfig.name}\n\n`;

  output += `**Domain:** ${domainConfig.domain}\n\n`;

  output += `**Total public pages:** ${pages.length}\n\n`;

  output += `---\n\n`;

  output += `## Pages grouped by brand\n\n`;

  for (const [brandName, brandPages] of brandGroups) {
    output += `<details>\n`;
    output += `<summary><strong>${brandName}</strong> (${brandPages.length} pages)</summary>\n\n`;

    output += markdownTable(brandPages);

    output += `\n</details>\n\n`;
  }

  output += `---\n\n`;

  output += `## Complete URL List\n\n`;

  output += markdownTable(pages);

  return output;
}

/**
 ============================================================
 * BRAND MARKDOWN
 ============================================================
 */

function generateBrandMarkdown(brandName, allPages) {
  const pages = allPages.filter(
    (page) => page.brand === brandName
  );

  let output = "";

  output += `# ${brandName}\n\n`;

  output += `**Total pages:** ${pages.length}\n\n`;

  output += `---\n\n`;

  const domainGroups = new Map();

  for (const page of pages) {
    if (!domainGroups.has(page.domainName)) {
      domainGroups.set(page.domainName, []);
    }

    domainGroups.get(page.domainName).push(page);
  }

  for (const [domainName, domainPages] of domainGroups) {
    output += `<details>\n`;
    output += `<summary><strong>${domainName}</strong> (${domainPages.length} pages)</summary>\n\n`;

    output += markdownTable(domainPages);

    output += `\n</details>\n\n`;
  }

  return output;
}

/**
 ============================================================
 * MASTER README
 ============================================================
 */

function generateMasterReadme(domainResults, allPages) {
  let output = "";

  output += `# Public URLs\n\n`;

  output += `Automatically generated public URL index for all domains and brands.\n\n`;

  output += `> ⚠️ This file is automatically generated. Do not manually edit the generated sections.\n\n`;

  output += `## Overview\n\n`;

  output += `| Domain | Pages |\n`;
  output += `|---|---:|\n`;

  for (const result of domainResults) {
    output += `| [${result.config.name}](${result.config.domain}) | ${result.pages.length} |\n`;
  }

  output += `| **Total** | **${allPages.length}** |\n\n`;

  output += `---\n\n`;

  output += `# Domains\n\n`;

  for (const result of domainResults) {
    const fileName = `${result.config.directory}.md`;

    output += `<details>\n`;
    output += `<summary><strong>${result.config.name}</strong> (${result.pages.length} pages)</summary>\n\n`;

    output += `**Domain:** ${result.config.domain}\n\n`;

    output += `**Complete page index:** [domains/${fileName}](./domains/${fileName})\n\n`;

    output += `### Brands\n\n`;

    const brandCounts = {};

    for (const page of result.pages) {
      brandCounts[page.brand] =
        (brandCounts[page.brand] || 0) + 1;
    }

    for (const [brand, count] of Object.entries(
      brandCounts
    )) {
      output += `- **${brand}**: ${count} pages\n`;
    }

    output += `\n</details>\n\n`;
  }

  output += `---\n\n`;

  output += `# Brands\n\n`;

  const allBrandNames = [
    "Dr. Love",
    ...BRANDS.map((brand) => brand.name),
  ];

  for (const brandName of allBrandNames) {
    const slug = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const brandPages = allPages.filter(
      (page) => page.brand === brandName
    );

    output += `- [${brandName}](./brands/${slug}.md) - ${brandPages.length} pages\n`;
  }

  output += `\n---\n\n`;

  output += `# Sitemap\n\n`;

  output += `Each public domain should maintain its own XML sitemap.\n\n`;

  output += `| Domain | Sitemap |\n`;
  output += `|---|---|\n`;

  for (const result of domainResults) {
    output += `| ${result.config.name} | ${result.config.domain}/sitemap.xml |\n`;
  }

  output += `\n---\n\n`;

  output += `# Generation\n\n`;

  output += `This index is generated automatically from the HTML files in \`/sites\`.\n\n`;

  output += "```text\n";
  output += "HTML files\n";
  output += "    ↓\n";
  output += "generate-url-index.js\n";
  output += "    ↓\n";
  output += "domains/*.md\n";
  output += "brands/*.md\n";
  output += "README.md\n";
  output += "```\n";

  return output;
}

/**
 ============================================================
 * MAIN
 ============================================================
 */

function main() {
  console.log("");
  console.log("==============================================");
  console.log(" Public URL Index Generator");
  console.log("==============================================");
  console.log("");

  ensureDirectory(DOMAINS_DIR);
  ensureDirectory(BRANDS_DIR);

  const domainResults = [];
  let allPages = [];

  for (const domainConfig of DOMAINS) {
    console.log(
      `Scanning: ${domainConfig.name}`
    );

    const pages = scanDomain(domainConfig);

    console.log(
      `  Found ${pages.length} public HTML pages`
    );

    domainResults.push({
      config: domainConfig,
      pages,
    });

    allPages = allPages.concat(pages);
  }

  /**
   * Generate domain files
   */
  for (const result of domainResults) {
    const fileName =
      `${result.config.directory}.md`;

    const filePath =
      path.join(DOMAINS_DIR, fileName);

    const content =
      generateDomainMarkdown(
        result.config,
        result.pages
      );

    fs.writeFileSync(
      filePath,
      content,
      "utf8"
    );

    console.log(
      `Generated: domains/${fileName}`
    );
  }

  /**
   * Generate brand files
   */
  const brandNames = [
    "Dr. Love",
    ...BRANDS.map((brand) => brand.name),
  ];

  for (const brandName of brandNames) {
    const slug = brandName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const filePath =
      path.join(
        BRANDS_DIR,
        `${slug}.md`
      );

    const content =
      generateBrandMarkdown(
        brandName,
        allPages
      );

    fs.writeFileSync(
      filePath,
      content,
      "utf8"
    );

    console.log(
      `Generated: brands/${slug}.md`
    );
  }

  /**
   * Generate master README
   */
  const readme =
    generateMasterReadme(
      domainResults,
      allPages
    );

  fs.writeFileSync(
    README_FILE,
    readme,
    "utf8"
  );

  console.log("");
  console.log("----------------------------------------------");
  console.log(`Total domains: ${DOMAINS.length}`);
  console.log(`Total public pages: ${allPages.length}`);
  console.log("----------------------------------------------");
  console.log("");
  console.log("README.md generated successfully.");
  console.log("");
}

main();