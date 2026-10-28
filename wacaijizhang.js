/*
 * 挖财记账 VIP 解锁脚本 (GitHub 版)
 * 适用: APP v13.1.7
 * 说明: 本脚本基于抓包结果，精确覆盖 isVip 等相关字段。
 */


let obj;
try {
    obj = JSON.parse($response.body);
} catch (e) {
    // 非 JSON 响应，直接放行
    $done({});
    return;
}

const url = $request.url;
const EXPIRATION = 4092599349000; // 远期时间戳

// 记录日志，方便在 Quantumult X 中排查问题
console.log("【挖财脚本】命中: " + url);

/* ========== 1. 核心目标：用户信息接口 isVip 0 -> 1 ========== */
if (/usercenter\/userInfo/.test(url)) {
    if (obj.data) {
        obj.data.isVip = 1;
        console.log("【挖财脚本】userInfo.isVip 已改为 1");
    }
}

/* ========== 2. 「我的」接口：注入 vipInfo ========== */
if (/\/api\/my\/v\d/.test(url)) {
    if (obj.data) {
        obj.data.vipInfo = {
            "vipMemberType": "挖财记账超级年会员",
            "isVipMember": true,
            "expirationDate": EXPIRATION,
            "continuous": true,
            "remainingDays": 365,
            "consecutiveDays": 365
        };
        console.log("【挖财脚本】my.vipInfo 已注入");
    }
}

/* ========== 3. 会员中心接口：注入完整 VIP 字段 ========== */
if (/(vipmember\/v\d\/index|jz-activity\/bkk-frontier\/api\/vipmember\/v\d\/index)/.test(url)) {
    if (obj.data) {
        obj.data.vipInfo = {
            ...(obj.data.vipInfo || {}),
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
            "expireDaysDays": 365,
            "freeSendVipEnable": 0
        };
        console.log("【挖财脚本】vipmember.vipInfo 已注入");
    }
}

/* ========== 4. 兜底：任何响应中出现的 isVip 等字段 ========== */
function deepFix(node) {
    if (node === null || typeof node !== 'object') return;
    for (let k in node) {
        if (!node.hasOwnProperty(k)) continue;
        const v = node[k];
        const lk = k.toLowerCase();

        if (lk === 'isvip') {
            node[k] = 1;
        } else if (/^(is_?vip_?member|is_?member)$/.test(lk)) {
            node[k] = true;
        } else if (typeof v === 'object') {
            deepFix(v);
        }
    }
}
deepFix(obj);

$done({ body: JSON.stringify(obj) });
