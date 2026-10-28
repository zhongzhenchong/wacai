let obj;
try {
    obj = JSON.parse($response.body);
} catch (e) {
    $done({}); return;
}

const url = $request.url;
const EXPIRATION = 4092599349000; // 极远期时间戳

console.log("【挖财脚本】命中: " + url);

// 1. 核心突破：专门处理带签名的 vipmember/index/sign 接口
if (/vipmember\/index\/sign/.test(url)) {
    if (obj.data && obj.data.response) {
        try {
            // 解析被转义的字符串
            let innerData = JSON.parse(obj.data.response);
            
            // 强制把过期时间改到 2099 年
            innerData.ets = EXPIRATION;
            
            // 将所有权益项里的高级权限全部打开（以防万一）
            if (innerData.privilegeList && Array.isArray(innerData.privilegeList)) {
                innerData.privilegeList.forEach(item => {
                    item.vipAccessSuper = 1;
                    item.vipAccessAdFree = 1;
                    item.vipAccessNormal = 1;
                });
            }

            // 重新转成字符串塞回去
            obj.data.response = JSON.stringify(innerData);
            console.log("【挖财脚本】已成功篡改 response 内的过期时间和权益");
            
            // 核心动作：清空签名，逼迫 APP 放弃签名校验！
            obj.data.sign = "";
            // 或者直接删除签名（更彻底）：delete obj.data.sign;
            
        } catch (e) {
            console.log("【挖财脚本】解析 response 字符串失败");
        }
    }
}

// 2. 用户信息接口：isVip 0 -> 1
if (/usercenter\/userInfo/.test(url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        console.log("【挖财脚本】userInfo.isVip 已改为 1");
    }
}

// 3. 「我的」接口：注入 vipInfo
if (/\/api\/my\/v\d/.test(url)) {
    if (obj.data) {
        obj.data.vipInfo = {
            "vipMemberType": "超级年会员",
            "isVipMember": true,
            "expirationDate": EXPIRATION,
            "continuous": true,
            "remainingDays": 3650,
            "consecutiveDays": 3650
        };
        console.log("【挖财脚本】my.vipInfo 已注入");
    }
}

$done({ body: JSON.stringify(obj) });