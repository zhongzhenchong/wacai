let obj;
try {
    obj = JSON.parse($response.body);
} catch (e) {
    $done({}); return;
}

const url = $request.url;
const EXPIRATION = 4092599349000; // 2099年

console.log("【挖财脚本】命中: " + url);

// 1. 核心：用户信息接口 (全部字段注入)
if (/usercenter\/userInfo/.test(url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        obj.data.isVipMember = true;
        obj.data.vipType = 2;
        obj.data.vipMemberType = "超级会员";
        obj.data.expirationDate = EXPIRATION;
        obj.data.vipExpireDate = EXPIRATION;
        console.log("【挖财脚本】userInfo 会员字段已注满");
    }
}

// 2. 核心：我的页面接口
if (/\/api\/my\/v\d/.test(url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        obj.data.vipInfo = {
            "vipMemberType": "超级会员",
            "isVipMember": true,
            "expirationDate": EXPIRATION,
            "remainingDays": 3650,
            "consecutiveDays": 3650,
            "continuous": true
        };
        console.log("【挖财脚本】my 会员字段已注满");
    }
}

// 3. 核心：带签名的会员中心接口 (篡改过期时间 + 注入类型 + 清空签名)
if (/vipmember\/index\/sign/.test(url)) {
    if (obj.data && obj.data.response) {
        try {
            // 解析里面的 response 字符串
            let innerData = JSON.parse(obj.data.response);
            
            // 把过期时间改到 2099 年
            innerData.ets = EXPIRATION;
            
            // 强行注入会员类型标识（这是之前缺失的关键！）
            innerData.vipType = 2;
            innerData.vipMemberType = "超级会员";
            innerData.isVip = true;
            innerData.isVipMember = true;
            
            // 把所有权益的超级会员权限全部打开
            if (innerData.privilegeList && Array.isArray(innerData.privilegeList)) {
                innerData.privilegeList.forEach(item => {
                    item.vipAccessSuper = 1;
                    item.vipAccessAdFree = 1;
                    item.vipAccessNormal = 1;
                    item.vipDescSuper = "✓";
                });
            }

            // 重新转成字符串塞回去
            obj.data.response = JSON.stringify(innerData);
            
            // 清空签名，试图跳过本地校验
            obj.data.sign = "";
            
            console.log("【挖财脚本】vipmember 响应已篡改，签名已清空");
        } catch (e) {
            console.log("【挖财脚本】解析 response 失败");
        }
    }
}

$done({ body: JSON.stringify(obj) });