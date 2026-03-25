---
name: evm-debug
description: 用于调试 EVM 网络、交易、合约与执行上下文。当用户需要查询链元数据、排查 fork chain、模拟或重放交易、拉取合约源码或 ABI，以及处理其他 EVM 调试问题时使用。优先依赖本地 references 和确定性的项目工具，不要猜测。
---

# EVM 调试

把这个 skill 作为项目级的 EVM 调试入口。它的目标是逐步扩展成一个多能力工具集，覆盖链元数据、fork chain 分析、历史或假设交易模拟，以及合约信息解析。每个能力都应当作为同一个 skill 内的独立模块持续扩展，而不是把整个 skill 收缩成单一用途的小工具。

## 能力地图

- 链基础信息查询

## 1：链基础信息查询

- 单一 reference 文件：`skills/evm-debug/references/chains-reference.jsonl`
- 优先依赖本地 reference 文件，而不是模型记忆。
- 如果直接字符串搜索更快，优先对 `skills/evm-debug/references/chains-reference.jsonl` 使用 `rg`。


1. 读取 `skills/evm-debug/references/chains-reference.jsonl`。
2. 使用用户问题去匹配 `aliases`、`name`、`chain`、`shortName` 或 `symbol`。
3. 如果找到结果，根据用户问题返回对应字段。
4. 当前可直接从该文件回答的信息包括：`chainId`、链名称、`shortName`、原生代币信息、RPC 列表、浏览器或 scan 信息，以及原始链条目中的其他基础字段。
5. 如果结果有歧义，比较候选条目的 `name`、`title`、`chain` 与 `raw` 字段后再决定。






