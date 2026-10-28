let obj = JSON.parse($response.body);
console.log("【挖财脚本】命中 URL: " + $request.url);

if (/usercenter\/userInfo/.test($request.url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        console.log("【挖财脚本】isVip 已改为 1，原值: " + JSON.stringify(obj.data.isVip));
    }
}

$done({ body: JSON.stringify(obj) });
