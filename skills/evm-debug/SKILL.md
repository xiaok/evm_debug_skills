---
name: evm-debug
description: 用于调试 EVM 网络、交易、合约与执行上下文。当用户需要查询链元数据、排查 fork chain、模拟或重放交易、拉取合约源码或 ABI，以及处理其他 EVM 调试问题时使用。优先依赖本地 references 和确定性的项目工具，不要猜测。
---

# EVM 调试

把这个 skill 作为项目级的 EVM 调试入口。它的目标是逐步扩展成一个多能力工具集，覆盖链元数据、fork chain 分析、历史或假设交易模拟，以及合约信息解析。每个能力都应当作为同一个 skill 内的独立模块持续扩展，而不是把整个 skill 收缩成单一用途的小工具。

## 前置条件

- 需要安装 Foundry，执行：
  `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- 安装完成后，必须确认 `cast` 可运行，执行：
  `cast --version`
- 如果 `cast --version` 失败，不要继续执行依赖 Foundry 的 fork、模拟、calldata encode/decode 等能力，先修复环境。

## 能力地图

- 链基础信息查询
- 4byte 签名解码

## 1：链基础信息查询

- 单一 reference 文件：`skills/evm-debug/references/chains-reference.jsonl`
- 优先依赖本地 reference 文件，而不是模型记忆。
- 如果直接字符串搜索更快，优先对 `skills/evm-debug/references/chains-reference.jsonl` 使用 `rg`。


1. 读取 `skills/evm-debug/references/chains-reference.jsonl`。
2. 使用用户问题去匹配 `aliases`、`name`、`chain`、`shortName` 或 `symbol`。
3. 如果找到结果，根据用户问题返回对应字段。
4. 当前可直接从该文件回答的信息包括：`chainId`、链名称、`shortName`、原生代币信息、RPC 列表、浏览器或 scan 信息，以及原始链条目中的其他基础字段。
5. 如果结果有歧义，比较候选条目的 `name`、`title`、`chain` 与 `raw` 字段后再决定。

## 2：4byte 签名解码

- 查询脚本：`skills/evm-debug/scripts/decode-4byte-signature.mjs`
- 这个能力同时覆盖两类输入：
  - 4-byte function selector
  - 32-byte event topic0

适用场景：

- 用户给出一个 4-byte function selector，例如 `0xa9059cbb`
- 用户给出一个 32-byte event topic，例如 `0xddf252ad...`
- 用户要求把一段 hex 解码为可读函数签名或事件签名
- 注意！当你拥有明确的 abi 或者合约源码的时候，不要调用这个，直接参考 abi，这个功能仅适用于未知源码

执行规则：

1. 先检查输入是否带 `0x`，没有则补上。
2. 去掉 `0x` 后如果是 8 个十六进制字符，按函数 selector 处理，请求：
   `GET /api/v1/signatures/?hex_signature=...`
3. 去掉 `0x` 后如果是 64 个十六进制字符，按 event topic 处理，请求：
   `GET /api/v1/event-signatures/?hex_signature=...`
4. 其他长度一律视为无效输入，不要猜测。
5. 需要查询时，优先直接运行：
   `node skills/evm-debug/scripts/decode-4byte-signature.mjs <hex>`
6. 如果只有一个结果，直接返回 `text_signature`。
7. 如果没有结果，明确说明 4byte 中未找到匹配项，不要猜测。
