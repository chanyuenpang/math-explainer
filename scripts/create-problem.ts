#!/usr/bin/env npx tsx
/**
 * 题目脚手架工具 — 生成新题目的 JSON 模板
 * 用法：npx tsx scripts/create-problem.ts <题目ID> <标题> <类型>
 * 示例：npx tsx scripts/create-problem.ts math-006 "等边三角形性质" equilateral-triangle
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [id, title, category] = process.argv.slice(2);

if (!id || !title || !category) {
  console.log('用法: npx tsx scripts/create-problem.ts <题目ID> <标题> <类型>');
  console.log('示例: npx tsx scripts/create-problem.ts math-006 "等边三角形性质" equilateral-triangle');
  process.exit(1);
}

const template = {
  id,
  title,
  source: "自定义题目",
  category,
  difficulty: "medium",
  tags: [category],
  geometry: {
    points: [
      { id: "A", x: 100, y: 100, label: "A" },
      { id: "B", x: 300, y: 100, label: "B" },
      { id: "C", x: 200, y: 250, label: "C" }
    ],
    connections: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" }
    ],
    triangles: ["ABC"],
    angleArcs: [],
    equalPairs: {}
  },
  steps: [
    {
      id: 0,
      title: "绘制图形",
      content: `绘制${title}的基本图形`,
      conclusion: ""
    },
    {
      id: 1,
      title: "分析",
      content: "分析已知条件",
      conclusion: ""
    }
  ],
  stepAnimations: [
    {
      drawEdge: ["AB", "BC", "CA"]
    },
    {
      highlightEdges: [
        { edge: "AB", color: "#10B981" },
        { edge: "BC", color: "#3B82F6" },
        { edge: "CA", color: "#F97316" }
      ]
    }
  ],
  question: {
    text: "",
    diagram: {
      type: category,
      points: {},
      edges: [],
      rightAngles: [],
      equal: []
    }
  },
  solution: {
    text: ""
  },
  created_at: new Date().toISOString()
};

const outputPath = path.join(__dirname, '..', 'src', 'data', 'problems', `${id}.json`);
if (fs.existsSync(outputPath)) {
  console.error(`❌ 文件已存在: ${outputPath}`);
  process.exit(1);
}

fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
console.log(`✅ 题目模板已创建: ${outputPath}`);
console.log(`📝 下一步: 编辑 JSON 文件，完善几何图形和步骤内容`);
