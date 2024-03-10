const slugify = require("@sindresorhus/slugify");
const markdownIt = require("markdown-it");
const fs = require("fs");
const matter = require("gray-matter");
const faviconsPlugin = require("eleventy-plugin-gen-favicons");
const tocPlugin = require("eleventy-plugin-nesting-toc");
const { parse } = require("node-html-parser");
const htmlMinifier = require("html-minifier");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const Image = require("@11ty/eleventy-img");

const { headerToId, namedHeadingsFilter } = require("./src/helpers/utils");
const {
  userMarkdownSetup,
  userEleventySetup,
} = require("./src/helpers/userSetup");

module.exports = function (eleventyConfig) {
  // Copy all files in the JavaScript folder to our output directory.
  eleventyConfig.addPassthroughCopy("src/javascript");

  // generate images, while this is async we don’t wait
  eleventyConfig.addTransform("generateImages", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".html")) {
      const images = parse(content).querySelectorAll("img");
      for (const image of images) {
        const src = image.getAttribute("src");
        const cls = image.getAttribute("class");
        const alt = image.getAttribute("alt");
        const meta = await Image(src, {
          widths: [500, 700, "auto"],
          formats: ["webp", "jpeg"],
          outputDir: "./dist/img/optimized",
          urlPath: "/img/optimized",
        });
        const pictureTag = parse(`<picture></picture>`).firstChild;
        const sourceTags = meta.map(({ format, url }) => `<source srcset="${url}" type="image/${format}" />`).join('');
        const imgTag = `<img src="${meta[0].url}" alt="${alt}" class="${cls}" width="${meta[0].width}" />`;
        pictureTag.innerHTML = sourceTags + imgTag;
        image.replaceWith(pictureTag);
      }
    }
    return content;
  });

  eleventyConfig.addPlugin(pluginRss, {
    posthtmlRenderOptions: {
      closingSingleTag: "slash",
      singleTags: ["link"],
    },
  });

  eleventyConfig.addTransform("callout-block", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      const parsed = parse(content);
      const transformCalloutBlocks = (blockquotes = parsed.querySelectorAll("blockquote")) => {
        for (const blockquote of blockquotes) {
          transformCalloutBlocks(blockquote.querySelectorAll("blockquote"));

          let content = blockquote.innerHTML;

          let titleDiv = "";
          let calloutType = "";
          let isCollapsable;
          let isCollapsed;
          const calloutMeta = /\[!([\w-]*)\](\+|\-){0,1}(\s?.*)/;
          if (!content.match(calloutMeta)) {
            continue;
          }

          content = content.replace(calloutMeta, function (metaInfoMatch, callout, collapse, title) {
            isCollapsable = Boolean(collapse);
            isCollapsed = collapse === "-";
            const titleText = title.replace(/(<\/{0,1}\w+>)/, "")
              ? title
              : `${callout.charAt(0).toUpperCase()}${callout.substring(1).toLowerCase()}`;
            const fold = isCollapsable
              ? `<div class="callout-fold"><i icon-name="chevron-down"></i></div>`
              : ``;

            calloutType = callout;
            titleDiv = `<div class="callout-title"><div class="callout-title-inner">${titleText}</div>${fold}</div>`;
            return "";
          });

          blockquote.tagName = "div";
          blockquote.classList.add("callout");
          blockquote.classList.add(isCollapsable ? "is-collapsible" : "");
          blockquote.classList.add(isCollapsed ? "is-collapsed" : "");
          blockquote.setAttribute("data-callout", calloutType.toLowerCase());
          blockquote.innerHTML = `${titleDiv}\n<div class="callout-content">${content}</div>`;
        }
      };

      transformCalloutBlocks();

      return parsed.toString();
    }
    return content;
  });

  eleventyConfig.addTransform("table", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      const parsed = parse(content);
      for (const t of parsed.querySelectorAll(".cm-s-obsidian > table")) {
        let inner = t.innerHTML;
        t.tagName = "div";
        t.classList.add("table-wrapper");
        t.innerHTML = `<table>${inner}</table>`;
      }

      for (const t of parsed.querySelectorAll(
        ".cm-s-obsidian > .block-language-dataview > table"
      )) {
        t.classList.add("dataview");
        t.classList.add("table-view-table");
        t.querySelector("thead")?.classList.add("table-view-thead");
        t.querySelector("tbody")?.classList.add("table-view-tbody");
        t.querySelectorAll("thead > tr")?.forEach((tr) => {
          tr.classList.add("table-view-tr-header");
        });
        t.querySelectorAll("thead > tr > th")?.forEach((th) => {
          th.classList.add("table-view-th");
        });
      }
      return parsed.toString();
    }
    return content;
  });

  eleventyConfig.addTransform("htmlMinifier", (content, outputPath) => {
    if (
      process.env.NODE_ENV === "production" &&
      outputPath &&
      outputPath.endsWith(".html")
    ) {
      return htmlMinifier.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        keepClosingSlash: true,
      });
    }
    return content;
  });

  eleventyConfig.addPassthroughCopy("src/site/img");
  eleventyConfig.addPassthroughCopy("src/site/scripts");
  eleventyConfig.addPassthroughCopy("src/site/styles/_theme.*.css");
  eleventyConfig.addPlugin(faviconsPlugin, { outputDir: "dist" });
  eleventyConfig.addPlugin(tocPlugin, {
    ul: true,
    tags: ["h1", "h2", "h3", "h4", "h5", "h6"],
  });

  eleventyConfig.addFilter("dateToZulu", function (date) {
    if (!date) return "";
    return new Date(date).toISOString("dd-MM-yyyyTHH:mm:ssZ");
  });

  eleventyConfig.addFilter("jsonify", function (variable) {
    return JSON.stringify(variable) || '""';
  });

  eleventyConfig.addFilter("validJson", function (variable) {
    if (Array.isArray(variable)) {
      return variable.map((x) => x.replaceAll("\\", "\\\\")).join(",");
    } else if (typeof variable === "string") {
      return variable.replaceAll("\\", "\\\\");
    }
    return variable;
  });

 eleventyConfig.addPlugin(pluginRss, {
    posthtmlRenderOptions: {
      closingSingleTag: "slash",
      singleTags: ["link"],
    },
  });

  userEleventySetup(eleventyConfig);

  return {
    dir: {
      input: "src/site",
      output: "dist",
      data: `_data`,
    },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
};