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
- 基于 cast 的链交互与数据解码

## 1：链基础信息查询

- 单一 reference 文件：`skills/evm-debug/references/chains-reference.jsonl`
- 优先依赖本地 reference 文件，而不是模型记忆。
- 如果直接字符串搜索更快，优先对 `skills/evm-debug/references/chains-reference.jsonl` 使用 `rg`。


1. 读取 `skills/evm-debug/references/chains-reference.jsonl`。
2. 使用用户问题去匹配 `aliases`、`name`、`chain`、`shortName` 或 `symbol`。
3. 如果找到结果，根据用户问题返回对应字段。
4. 当前可直接从该文件回答的信息包括：`chainId`、链名称、`shortName`、原生代币信息、RPC 列表、浏览器或 scan 信息，以及原始链条目中的其他基础字段。
5. 如果结果有歧义，比较候选条目的 `name`、`title`、`chain` 与 `raw` 字段后再决定。
6. 如果后续要执行 `cast`，优先从这里选择可用链参数：
   - `raw.rpc` 中优先选择可直接使用的 HTTPS RPC
   - 尽量跳过带 `${...}` 占位符的 RPC
   - `raw.explorers` 可作为 scan / block explorer 上下文来源
7. 当用户要求查询区块、交易、receipt、storage、logs、contract source、ABI 编解码、selector/topic 解码时，优先进入下面的 `cast` 流程，而不是单独再造脚本。

## 2：基于 cast 的链交互与数据解码

- 参考文档：`skills/evm-debug/references/cast-reference.md`
- `cast` 是这个 skill 的标准命令行入口；只要问题适合通过 Foundry CLI 解决，就优先使用 `cast`。
- 只要涉及链上读取，默认显式传入 `--rpc-url <rpc>`，其中 `<rpc>` 优先来自“链基础信息查询”步骤拿到的可用 RPC。
- 如果需要结合区块浏览器上下文，优先使用同一步骤拿到的 `raw.explorers` 信息；不要凭空猜测 explorer API 类型、域名参数或 API key 名称。
- 这是一个 debug skill，不是交易执行 skill。默认允许使用 `cast call` 及其他只读/解码命令；`cast send`、`cast publish`、广播或任何写链操作，除非用户明确要求，否则不要使用。

适用场景：

- 用户要求读取区块、交易、receipt、logs、nonce、balance、storage、code、source
- 用户要求 encode/decode calldata、event、error、ABI 输出
- 用户给出 selector、topic0 或完整 calldata，希望还原函数或事件签名
- 用户要求基于 RPC 做只读调试或辅助模拟

执行规则：

1. 先完成“链基础信息查询”，拿到可用 RPC / scan 信息。
2. 优先使用 `cast` 官方能力，不要为这些能力再新增自定义脚本。
3. 常见读取命令示例：
   - 最新区块号：`cast block-number --rpc-url <rpc>`
   - 交易详情：`cast tx <tx_hash> --rpc-url <rpc>`
   - 交易回执：`cast receipt <tx_hash> --rpc-url <rpc>`
   - 只读调用：`cast call <contract> "<signature>" <args...> --rpc-url <rpc>`
   - 余额：`cast balance <address> --rpc-url <rpc>`
   - 存储槽：`cast storage <contract> <slot> --rpc-url <rpc>`
4. `cast call` 是允许的默认读路径，可用于：
   - 读取 view/pure 函数
   - 使用 `--trace` 做本地只读调试
   - 配合已知 ABI / 签名检查返回值
5. 不要主动使用写链命令，例如：
   - `cast send`
   - `cast publish`
   - 任何需要签名、广播、提交到链上的交易路径
   只有在用户明确要求执行写操作时，才可以进入这些命令。
6. 常见 ABI 编解码命令示例：
   - 编码函数调用：`cast calldata "<signature>" <args...>`
   - 解码 calldata：`cast decode-calldata "<signature>" <calldata>`
   - 解码 event：`cast decode-event "<event_signature>" <topics_and_data>`
   - 解码 error：`cast decode-error <error_data>`
7. 对 4byte / topic 场景统一使用 `cast`：
   - 函数 selector：`cast 4byte <selector>`
   - 完整 calldata：`cast 4byte-calldata <calldata>`
   - event topic0：`cast 4byte-event <topic0>`
8. 当你已经拥有明确 ABI 或源码时，不要再使用 `cast 4byte*` 猜签名；优先使用 ABI 精确解码能力，如 `cast decode-calldata`、`cast decode-event`、`cast decode-abi`。
9. 如果 `cast` 未返回结果，明确说明未查到匹配项，不要猜测。
