var yandex_bsearch_tags = {
  description: "Find tag on Yandex.Blogs",
  shortDescription: "Yandex.Blogs",
  icon: "https://blogs.yandex.ru/favicon.ico",
  scope: {
    semantic: {
      "tag" : "tag"
    }
  },
  doAction: function(semanticObject, semanticObjectType) {
    if(semanticObject.tag) {
      return "https://blogs.yandex.ru/search.xml?category=" + encodeURIComponent(semanticObject.tag);
    }
    return null;
  }
};

SemanticActions.add("yandex_bsearch_tags", yandex_bsearch_tags);
