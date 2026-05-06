@AGENTS.md
@PERSONAS.md

# このプロジェクトについて

中学校クラブの保護者向けWebアプリ。
実装・レビュー・UI変更を行う際は、必ず PERSONAS.md のペルソナを参照し、
ペルソナの目的・リテラシー・利用環境に合った判断をすること。

# UIスタック

- **shadcn/ui** を使う。UIコンポーネントはまず shadcn/ui から選ぶ
- **Tailwind CSS** の utility-first の思想に従う。カスタムCSSは原則書かない
- shadcn/ui にないものだけ Tailwind で直接組む
- コンポーネントの追加は `npx shadcn@latest add <component>` で行う
- デザイントークン（色・スペーシング・角丸）は Tailwind の標準スケールを使う
- スマートフォン優先（mobile-first）。`sm:` `md:` でPC向けを拡張する
- **input のフォントサイズは必ず `text-base`（16px）以上**にする。16px未満だとiOSが自動ズームするため
