import { onRequest as __api_photo__id__js_onRequest } from "/home/legion/old-photos/functions/api/photo/[id].js"
import { onRequest as __api_count_js_onRequest } from "/home/legion/old-photos/functions/api/count.js"
import { onRequest as __api_photos_js_onRequest } from "/home/legion/old-photos/functions/api/photos.js"
import { onRequest as __api_search_js_onRequest } from "/home/legion/old-photos/functions/api/search.js"
import { onRequest as __api_stats_js_onRequest } from "/home/legion/old-photos/functions/api/stats.js"
import { onRequest as __api_upvote_js_onRequest } from "/home/legion/old-photos/functions/api/upvote.js"

export const routes = [
    {
      routePath: "/api/photo/:id",
      mountPath: "/api/photo",
      method: "",
      middlewares: [],
      modules: [__api_photo__id__js_onRequest],
    },
  {
      routePath: "/api/count",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_count_js_onRequest],
    },
  {
      routePath: "/api/photos",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_photos_js_onRequest],
    },
  {
      routePath: "/api/search",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_search_js_onRequest],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_stats_js_onRequest],
    },
  {
      routePath: "/api/upvote",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_upvote_js_onRequest],
    },
  ]