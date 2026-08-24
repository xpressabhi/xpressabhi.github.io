import { test } from "node:test";
import assert from "node:assert/strict";
import { render, stripMd, mdToHtml, escHtml, tokenize } from "../lib/engine.mjs";

test("render interpolates simple paths", () => {
  assert.equal(render("Hello {{name}}!", [{ name: "Ada" }]), "Hello Ada!");
});

test("render resolves nested paths and returns empty for missing", () => {
  assert.equal(render("{{a.b.c}}|{{nope}}", [{ a: { b: { c: 7 } } }]), "7|");
});

test("render null/undefined render as empty string", () => {
  assert.equal(render("[{{x}}]", [{ x: null }]), "[]");
});

test("each over array exposes this, @index", () => {
  const out = render("{{#each items}}{{@index}}:{{this}};{{/each}}", [{ items: ["a", "b"] }]);
  assert.equal(out, "0:a;1:b;");
});

test("each over object exposes @key", () => {
  const out = render("{{#each groups}}{{@key}}={{this}} {{/each}}", [{ groups: { A: 1, B: 2 } }]);
  assert.equal(out, "A=1 B=2 ");
});

test("each over array of objects exposes fields", () => {
  const out = render("{{#each p}}{{name}}({{url}}) {{/each}}", [{ p: [{ name: "x", url: "u1" }, { name: "y" }] }]);
  assert.equal(out, "x(u1) y() ");
});

test("if/else picks branch on truthiness", () => {
  const tpl = "{{#if live}}L{{else}}D{{/if}}";
  assert.equal(render(tpl, [{ live: true }]), "L");
  assert.equal(render(tpl, [{ live: false }]), "D");
  assert.equal(render(tpl, [{ live: [] }]), "D");
  assert.equal(render(tpl, [{}]), "D");
});

test("join renders arrays with separator, falls back to value", () => {
  assert.equal(render('{{join tags ", "}}', [{ tags: ["a", "b"] }]), "a, b");
  assert.equal(render('{{join name ", "}}', [{ name: "solo" }]), "solo");
});

test("tokenize keeps literal text around tokens", () => {
  assert.equal(tokenize("a {{x}} b").length, 3);
});

test("escHtml escapes the dangerous four", () => {
  assert.equal(escHtml(`<a href="x">&`), "&lt;a href=&quot;x&quot;&gt;&amp;");
});

test("stripMd removes links, code and emphasis", () => {
  assert.equal(stripMd("[t](https://x) and `code` **bold**"), "t and code bold");
});

test("mdToHtml: paragraph, heading, list, fence, table", () => {
  const html = mdToHtml("# Title\n\nPara with `code`.\n\n- one\n- two\n\n```py\nx=1\n```\n\n| h |\n|---|\n| v |");
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<p>Para with <code>code<\/code>.<\/p>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<pre class="code" data-lang="py"><code>x=1<\/code><\/pre>/);
  assert.match(html, /<table><thead><tr><th>h<\/th><\/tr><\/thead><tbody><tr><td>v<\/td><\/tr>/);
});

test("mdToHtml escapes html in source markdown", () => {
  assert.match(mdToHtml("<script>alert(1)</script>"), /&lt;script&gt;/);
  assert.doesNotMatch(mdToHtml("<script>alert(1)</script>"), /<script>/);
});

test("mdToHtml escapes template braces to prevent injection", () => {
  assert.match(mdToHtml("{{name}}"), /&#123;&#123;name&#125;&#125;/);
});

test("mdToHtml nested lists", () => {
  const html = mdToHtml("- a\n  - a1\n- b");
  assert.match(html, /<li>a<ul><li>a1<\/li><\/ul><\/li><li>b<\/li>/);
});
