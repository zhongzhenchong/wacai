let obj;
try {
    obj = JSON.parse($response.body);
} catch (e) {
    $done({}); return;
}

const url = $request.url;
const EXPIRATION = 4092599349000; // 远期时间戳（永久）

console.log("【挖财脚本】命中: " + url);

// 1. 用户信息接口：isVip 0 -> 1
if (/usercenter\/userInfo/.test(url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        console.log("【挖财脚本】userInfo.isVip 已改为 1");
    }
}

// 2. 核心：会员中心接口注入 (兼容 /vipmember/index 和 /vipmember/v2/index)
if (/vipmember\/(v\d+\/)?index|vipmember\/privilege/.test(url)) {
    if (obj.data) {
        obj.data.vipInfo = {
            ...(obj.data.vipInfo || {}),
            "vipMemberType": "挖财记账超级年会员",
            "isVipMember": true,
            "adFreeVipEnable": 1,
            "supportadFreeVip": 1,
            "adFreePermanentVip": true,
            "vipMemberEnable": 1,
            "continuousEnable": 1,
            "continuousType": 1,
            "expirationDate": EXPIRATION,
            "superExpireDate": EXPIRATION,
            "adFreeExpireDate": EXPIRATION,
            "isPermanentVip": true,
            "freeSendAdFreeVipEnable": 0,
            "vipType": 2,
            "expireDaysDays": 3650,
            "freeSendVipEnable": 0
        };
        console.log("【挖财脚本】vipmember 会员字段已注入");
    }
}

// 3. 「我的」接口：注入 vipInfo
if (/\/api\/my\/v\d/.test(url)) {
    if (obj.data) {
        obj.data.vipInfo = {
            "vipMemberType": "挖财记账超级年会员",
            "isVipMember": true,
            "expirationDate": EXPIRATION,
            "continuous": true,
            "remainingDays": 3650,
            "consecutiveDays": 3650
        };
        console.log("【挖财脚本】my.vipInfo 已注入");
    }
}

// 4. 强力兜底：遍历所有响应，遇到 VIP 字段全部强改
function deepFix(node) {
    if (node === null || typeof node !== 'object') return;
    for (let k in node) {
        if (!node.hasOwnProperty(k)) continue;
        const v = node[k];
        const lk = k.toLowerCase();

        if (lk === 'isvip') {
            node[k] = 1;
        } else if (/^(is_?vip_?member|is_?member|vip_?member_?enable)$/.test(lk)) {
            node[k] = true;
        } else if (/^(vip_?type|vip_?level|member_?level)$/.test(lk)) {
            node[k] = 2; 
        } else if (/^(expire_?date|expire_?time|super_?expire_?date|adfree_?expire_?date)$/.test(lk)) {
            node[k] = EXPIRATION;
        } else if (typeof v === 'object') {
            deepFix(v);
        }
    }
}
deepFix(obj);

$done({ body: JSON.stringify(obj) });