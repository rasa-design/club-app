const items = [
  {
    num: '１',
    title: '本番は特別な日ではない！と捉える',
    body: '本番は日常の延長線上にあるもの。だからこそいつも通りの力を発揮できる。\n本番だから頑張ろうではなく、いつも通りでいこうという心持ちが大切。',
  },
  {
    num: '２',
    title: 'いつも70点出せればいい！と考えている',
    body: '完璧主義だと本番で力を発揮するのは難しいもの。\nこれは自分に過度なプレッシャーをかけないためのコツ。ベストを尽くせればそれでいいと肩の力を抜くことが大切。',
  },
  {
    num: '３',
    title: '事前の準備をこれ以上ないほどする',
    body: 'この準備なら大丈夫と自信を持てるまで誰よりも入念に準備をする。\nそうする事で本番では自然と力が発揮できる様になる。',
  },
  {
    num: '４',
    title: '緊張するような場に普段から身を置く',
    body: '本番で緊張しないためには普段から緊張する場に身を置くことが大切。\n緊張に慣れる事で本番での緊張が和らぐはず。',
  },
  {
    num: '５',
    title: '自分だけの世界に入り込むことができる',
    body: '本番で周りの雑音に惑わされないためには自分だけの世界に入る力が必要。\n周りがどんなに騒がしくても自分の世界に没頭できる集中力を持つ。',
  },
]

export default function MindsetPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">マインドセット</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.num} className="rounded-lg border bg-card p-4 space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-[#E85FA0] shrink-0">{item.num}</span>
              <h3 className="text-sm font-bold leading-snug">{item.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-5">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
