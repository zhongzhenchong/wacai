
[rewrite_local]
# 匹配 jz.wacaijizhang.com 域名下的所有 API 请求，避免因具体路径变化而漏拦
^https?:\/\/jz\.wacaijizhang\.com\/api\/ url script-response-body https://raw.githubusercontent.com/zhongzhenchong/wacai/refs/heads/main/wacaijizhang.js

[mitm]
hostname = jz.wacaijizhang.com

*************************************/

let obj;
try {
    obj = JSON.parse($response.body);
} catch (e) {
    // 如果响应不是合法的 JSON，则不做任何修改，直接放行
    $done({});
    return;
}

const EXPIRATION = 4092599349000; // 远期时间戳，代表永久有效

// 递归函数：遍历 JSON 对象的所有层级，查找并覆盖会员相关字段
function traverseAndOverride(node) {
    if (node === null || typeof node !== 'object') return;

    for (let key in node) {
        if (node.hasOwnProperty(key)) {
            const value = node[key];
            const lowerKey = key.toLowerCase();

            // 1. 处理布尔值类型的会员标志字段
            if (typeof value === 'boolean' && /^(is_?vip|is_?member|vip_?member|permanent)/.test(lowerKey)) {
                node[key] = true;
                continue;
            }

            // 2. 处理数字/字符串类型的会员等级、状态字段
            if ((typeof value === 'number' || typeof value === 'string') && /^(vip_?(level|type|status)|member_?(level|type))/i.test(key)) {
                // 如果是字符串类型，尝试保持原类型覆盖为 "99"；如果是数字，则覆盖为 99
                node[key] = (typeof value === 'string') ? "99" : 99;
                continue;
            }

            // 3. 处理所有可能的时间戳字段，统一覆盖为远期时间
            if (/^(expir|expire|end|due|valid|super|adfree|ad_free)/i.test(key) && (typeof value === 'number' || typeof value === 'string')) {
                if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
                    node[key] = EXPIRATION;
                }
                continue;
            }

            // 4. 如果当前值是一个对象，则递归进入该对象继续查找
            if (typeof value === 'object') {
                traverseAndOverride(value);
            }
        }
    }
}

// 从根节点开始执行遍历和覆盖
traverseAndOverride(obj);

$done({ body: JSON.stringify(obj) });
