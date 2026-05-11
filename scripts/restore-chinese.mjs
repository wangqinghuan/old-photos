import * as fs from "fs";

const DATA_FILE = "src/data/photos.json";

// Old Chinese translations for 1mucf8l (from previous data, matched by author+score)
const OLD_CHINESE = {
  "1mucf8l": [
    { author: "NiceTrySuckaz", score: 2576, body: "我真的满脑子问号。怎么从\"来，咱们做个小手术\"变成\"那干脆把他变成女孩养吧\"？就跟你理发时一边剪短了，另一边也得跟着修，结果越修越短，最后干脆剃光算了？" },
    { author: "Lou_Hodo", score: 641, body: "这医生执照早该吊销了，告到他倾家荡产也不为过。谁他妈能给一个婴儿做这种建议？" },
    { author: "WildTemptxo", score: 1069, body: "大卫2004年自杀的。详情看维基百科。" },
    { author: "Shukumugo", score: 201, body: "《法律与秩序：特殊受害者》有一集演过这个故事，拍得挺渗人的。" },
    { author: "ilovepeonies1994", score: 152, body: "每次俩孩子不配合，那医生就发火。他们说曼尼在父母面前人模人样的，单独跟孩子在一起时就换了一副嘴脸。有一次让大卫脱衣服检查，大卫不肯，他就冲他吼：\"给我脱！\"那孩子吓得直哆嗦。" },
    { author: "ShouldofNoneButter", score: 109, body: "约翰·曼尼在霍普金斯大学到现在都还被当神一样供着，去世时退休宴会全场起立鼓掌……这人就是个变态，打着\"科研\"的幌子长期性侵那俩孩子，结果俩人都自杀了。" },
    { author: "RayZzorRayy", score: 200, body: "这俩人八成是全球最差父母的候选人。" },
    { author: "chere100", score: 43, body: "他哥哥两年前先没了，他还在悲痛中。他刚丢了工作，亏了65000美元，老婆也在他自杀前两天跑了。就算没有那段操蛋的童年，这人也是压力山大啊。可怜的人。:((" },
  ],
};

function restoreChinese(postId, oldComments) {
  const photos = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const post = photos.find((p) => p.id === postId);
  if (!post) { console.log(`Post ${postId} not found`); return; }

  let restored = 0;

  function walk(arr) {
    for (const c of arr) {
      const old = oldComments.find((o) => o.author === c.author);
      if (old) {
        c.body = old.body; // Replace English with Chinese
        restored++;
      }
      if (c.replies) walk(c.replies);
    }
  }
  walk(post.comments);

  fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
  console.log(`${postId}: restored ${restored} Chinese translations`);
}

restoreChinese("1mucf8l", OLD_CHINESE["1mucf8l"]);
