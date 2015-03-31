var plain_json = {
  //baseURL:"http://jsbin.com/ligusi/",
  baseURL:"data:text/html;base64,PCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PG1ldGEgY2hhcnNldD11dGYtOD48dGl0bGU+SlNPTiB2aWV3ZXI8L3RpdGxlPjxzdHlsZSB0eXBlPXRleHQvY3NzPi5lcnJvcntjb2xvcjpyZWR9cHJle291dGxpbmU6MXB4IHNvbGlkICNjY2M7cGFkZGluZzo1cHg7bWFyZ2luOjVweH0uc3RyaW5ne2NvbG9yOmdyZWVufS5udW1iZXJ7Y29sb3I6ZGFya29yYW5nZX0uYm9vbGVhbntjb2xvcjpibHVlfS5udWxse2NvbG9yOm1hZ2VudGF9LmtleXtjb2xvcjpyZWR9PC9zdHlsZT48L2hlYWQ+PGJvZHk+PHNjcmlwdD5mdW5jdGlvbiBqc29uU3ludGF4SGlnaGxpZ2h0KGEpe2E9YS5yZXBsYWNlKC8mL2csIiZhbXA7IikucmVwbGFjZSgvPC9nLCImbHQ7IikucmVwbGFjZSgvPi9nLCImZ3Q7Iik7cmV0dXJuIGEucmVwbGFjZSgvKCIoXFx1W2EtekEtWjAtOV17NH18XFxbXnVdfFteXFwiXSkqIihccyo6KT98XGIodHJ1ZXxmYWxzZXxudWxsKVxifC0/XGQrKD86XC5cZCopPyg/OltlRV1bK1wtXT9cZCspPykvZyxmdW5jdGlvbihjKXt2YXIgYj0ibnVtYmVyIjtpZigvXiIvLnRlc3QoYykpe2lmKC86JC8udGVzdChjKSl7Yj0ia2V5In1lbHNle2I9InN0cmluZyJ9fWVsc2V7aWYoL3RydWV8ZmFsc2UvLnRlc3QoYykpe2I9ImJvb2xlYW4ifWVsc2V7aWYoL251bGwvLnRlc3QoYykpe2I9Im51bGwifX19cmV0dXJuJzxzcGFuIGNsYXNzPSInK2IrJyI+JytjKyI8L3NwYW4+In0pfXZhciBzdHIsb2JqLGVycjtmdW5jdGlvbiBwYXJzZV9hcmdfc3RyKGEpe2Vycj11bmRlZmluZWQ7b2JqPXVuZGVmaW5lZDt0cnl7aWYoYS5zdGFydHNXaXRoKCIjIikpe2E9ZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZSh3aW5kb3cuYXRvYihhLnN1YnN0cigxKSkpKX1pZihhLnN0YXJ0c1dpdGgoIlsiKXx8YS5zdGFydHNXaXRoKCJ7Iikpe3N0cj1hO29iaj1KU09OLnBhcnNlKHN0cik7cmV0dXJuIHRydWV9ZXJyPSJVbmtub3duIHN0cmluZyBzdGFydDogIithLnN1YnN0cigwLDIwKTtyZXR1cm4gZmFsc2V9Y2F0Y2goYil7ZXJyPWJ9fWZ1bmN0aW9uIHNob3dfc3RyKGIpe2lmKHR5cGVvZiBvYmo9PSJ1bmRlZmluZWQiKXtkb2N1bWVudC5ib2R5Lmluc2VydEFkamFjZW50SFRNTCgiYmVmb3JlZW5kIiwiPHA+IitiKyIgPSAiK3N0cisiPC9wPiIpfWVsc2V7dmFyIGE9anNvblN5bnRheEhpZ2hsaWdodChKU09OLnN0cmluZ2lmeShvYmosdW5kZWZpbmVkLDQpKTtkb2N1bWVudC5ib2R5Lmluc2VydEFkamFjZW50SFRNTCgiYmVmb3JlZW5kIiwiPHA+IitiKyI6PHByZT5cbiIrYSsiPC9wcmU+PC9wPiIpfX1mdW5jdGlvbiBzaG93X2Vycigpe2lmKHR5cGVvZiBlcnI9PSJ1bmRlZmluZWQiKXtyZXR1cm59ZG9jdW1lbnQuYm9keS5pbnNlcnRBZGphY2VudEhUTUwoImJlZm9yZWVuZCIsJzxwIGNsYXNzPSJlcnJvciI+JytlcnIrIjwvcD4iKX1mdW5jdGlvbiBwYXJzZV9zZWFyY2goKXtpZihkb2N1bWVudC5sb2NhdGlvbi5zZWFyY2gpe2lmKHBhcnNlX2FyZ19zdHIoZGVjb2RlVVJJQ29tcG9uZW50KGRvY3VtZW50LmxvY2F0aW9uLnNlYXJjaC5zdWJ"+
                                "zdHIoMSkpKSl7c2hvd19zdHIoInNlYXJjaCIpfXNob3dfZXJyKCl9fWZ1bmN0aW9uIHBhcnNlX2hhc2goKXtpZihkb2N1bWVudC5sb2NhdGlvbi5oYXNoKXtpZihwYXJzZV9hcmdfc3RyKGRvY3VtZW50LmxvY2F0aW9uLmhhc2guc3Vic3RyKDEpKSl7c2hvd19zdHIoImhhc2giKX1zaG93X2VycigpfX1mdW5jdGlvbiBvbl9oYXNoX2NoYW5nZSgpe2lmKGRvY3VtZW50LmxvY2F0aW9uLmhhc2gpe3BhcnNlX2hhc2goKX1lbHNle3BhcnNlX3NlYXJjaCgpfX1wYXJzZV9zZWFyY2goKTtwYXJzZV9oYXNoKCk7d2luZG93Lm9uaGFzaGNoYW5nZT1vbl9oYXNoX2NoYW5nZTs8L3NjcmlwdD48L2JvZHk+PC9odG1sPgo=",
  description: "Show plain JSON",
  descriptionAll: "Show plain JSON",
  shortDescription: "Show plain JSON",
  shortDescriptionAll: "Show plain JSON",
  icon: "http://icongal.com/gallery/image/107548/chemistry_magic_tube_science_test.png",
  iconAll: "http://icongal.com/gallery/image/107548/chemistry_magic_tube_science_test.png",
  scope: {
    semantic: {
      "hCard":"hCard",
      "hCalendar":"hCalendar",
      "geo":"geo",
      "adr":"adr",
      "tag":"tag",
      "xFolk":"xFolk",
      "RDF":"RDF"
    }
  },
  getURL:function(obj, baseURL) {
    var s = JSON.stringify(obj);
    if(s.length>100 || !(s.startsWith('[')||s.startsWith('{')))
      s = "#"+window.btoa(unescape(encodeURIComponent(s)));
    return baseURL + s;
  },
  doAction: function(semanticObject, semanticObjectType) {
    return plain_json.getURL({
        semanticAction:"object",
        sourceUrl:content.document.location.href,
        sourceTitle:content.document.title,
        semanticObject:plain_json.flatObject(semanticObject),
        semanticObjectType:semanticObjectType
      });
  },
  doActionAll: function(semanticArrays, semanticObjectType) {
    plain_json.lastArray = semanticArrays;
    var obj = {};
    var p;
    for(p in semanticArrays)obj[p]=semanticArrays[p].map(plain_json.flatObject);
    return plain_json.getURL({
        semanticAction:"array",
        sourceUrl:content.document.location.href,
        sourceTitle:content.document.title,
        semanticArrays:obj,
        semanticObjectType:semanticObjectType
      });
  }
};

SemanticActions.add("plain_json", plain_json);
