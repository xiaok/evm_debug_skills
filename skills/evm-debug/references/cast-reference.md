# Cast Reference

Source materials:
- Official overview section from `https://www.getfoundry.sh/llms-full.txt`
- Local CLI inspection from `cast --help` and selected `cast <subcommand> --help`

Reviewed: 2026-03-25
Local version checked: `cast 1.5.1-nightly`

## Overview

Cast is Foundry's command-line tool for interacting with Ethereum and EVM-compatible chains.
It supports chain reads, contract calls, transaction construction and publishing, wallet operations,
ABI encoding and decoding, explorer-backed lookups, raw RPC access, and general EVM data utilities.

For this skill, Cast is the default CLI interface for EVM debugging work.
This does not mean all Cast commands are in scope: by default this debug skill should use read,
decode, tracing, and inspection commands, while transaction-sending or broadcasting commands should
only be used when the user explicitly requests a write action.

## Global usage rules

- Prefer explicit `--rpc-url <rpc>` for reproducibility
- Reuse chain metadata already resolved from `chains-reference.jsonl`
- Prefer HTTPS RPC endpoints that are directly usable
- Skip RPC URLs that still contain unresolved placeholders such as `${INFURA_API_KEY}`
- Reuse `raw.explorers` as explorer context, but do not guess explorer API conventions
- If ABI or verified source already exists, prefer exact ABI decoding over heuristic signature lookup
- If Cast returns multiple candidate signatures, report the ambiguity instead of silently picking one

## Command groups

### Chain and account reads

These commands are the main read-only entry points for debugging chain state:

- `cast chain`
- `cast chain-id`
- `cast client`
- `cast block-number`
- `cast block`
- `cast age`
- `cast gas-price`
- `cast balance`
- `cast nonce`
- `cast code`
- `cast codehash`
- `cast codesize`
- `cast storage`
- `cast storage-root`
- `cast proof`
- `cast logs`
- `cast tx`
- `cast receipt`

Common examples:

- Latest block number:
  `cast block-number --rpc-url <rpc>`
- Read an address balance:
  `cast balance <address> --rpc-url <rpc>`
- Read a transaction:
  `cast tx <tx_hash> --rpc-url <rpc>`
- Read a receipt:
  `cast receipt <tx_hash> --rpc-url <rpc>`
- Read a storage slot:
  `cast storage <contract> <slot> --rpc-url <rpc>`
- Query logs:
  `cast logs --rpc-url <rpc> <event_or_topic_filters>`

### Contract interaction and simulation

These commands are the main entry points for contract calls, transaction sends, and replay:

- `cast call`
- `cast send`
- `cast estimate`
- `cast access-list`
- `cast mktx`
- `cast publish`
- `cast run`

Skill scope note:

- `cast call` is in scope by default because it supports read-only inspection and local tracing
- `cast send`, `cast publish`, or other write-chain flows are out of scope unless the user
  explicitly asks for a write operation

Important `cast call` capabilities observed locally:

- Supports `--rpc-url <rpc>`
- Supports `--block <block>`
- Supports raw `--data <hex>`
- Supports `--trace`
- Supports `--debug`
- Supports local state overrides such as:
  - `--override-balance`
  - `--override-nonce`
  - `--override-code`
  - `--override-state`
  - `--override-state-diff`
- Supports block overrides such as:
  - `--block.time`
  - `--block.number`
- Supports local artifact-assisted trace decoding with `--with-local-artifacts`

Useful examples:

- Read-only call:
  `cast call <contract> "<signature>" <args...> --rpc-url <rpc>`
- Call using raw calldata:
  `cast call <contract> --data <hex> --rpc-url <rpc>`
- Trace a remote call locally:
  `cast call <contract> "<signature>" <args...> --rpc-url <rpc> --trace`
- Estimate gas:
  `cast estimate <contract> "<signature>" <args...> --rpc-url <rpc>`
- Send a transaction:
  `cast send <contract> "<signature>" <args...> --rpc-url <rpc> --private-key <key>`

### ABI encoding and decoding

These commands are the primary tools for calldata, events, errors, and ABI value handling:

- `cast calldata`
- `cast abi-encode`
- `cast abi-encode-event`
- `cast decode-abi`
- `cast decode-calldata`
- `cast decode-event`
- `cast decode-error`
- `cast decode-string`
- `cast pretty-calldata`
- `cast selectors`
- `cast sig`
- `cast sig-event`

Useful examples:

- Encode function calldata:
  `cast calldata "<signature>" <args...>`
- Encode arguments without selector:
  `cast abi-encode "<types>" <args...>`
- Decode calldata using a known signature:
  `cast decode-calldata "<signature>" <calldata>`
- Decode a revert payload:
  `cast decode-error <error_data>`
- Decode an event with known event signature:
  `cast decode-event "<event_signature>" <topics_and_data>`
- Compute a selector from a function signature:
  `cast sig "transfer(address,uint256)"`

Important `cast decode-calldata` behavior observed locally:

- The signature is required
- The calldata must include the function selector prefix
- Supports `-f, --file` for loading calldata from a file

### Signature and 4byte lookup

These commands use `openchain.xyz` style signature lookup and are useful only when ABI or source is
unknown:

- `cast 4byte <selector>`
- `cast 4byte-event <topic0>`
- `cast 4byte-calldata <calldata>`
- `cast upload-signature <signature_or_file_inputs>`

Recommended usage:

- Unknown function selector:
  `cast 4byte 0xa9059cbb`
- Unknown event topic0:
  `cast 4byte-event 0xddf252ad...`
- Unknown full calldata:
  `cast 4byte-calldata 0xa9059cbb000000000000000000000000...`

Do not use these commands if exact ABI or source is already available.

### Explorer and source-related commands

These commands rely on explorer-backed data or related metadata:

- `cast source`
- `cast creation-code`
- `cast constructor-args`
- `cast admin`
- `cast implementation`

Use these when investigating verified contracts, proxy layouts, and deployed bytecode provenance.

### Raw RPC and Anvil-oriented debugging

These commands are especially useful for local fork debugging or custom RPC workflows:

- `cast rpc`
- `cast run`
- `cast access-list`

The official docs also show Anvil custom-method workflows using `cast rpc`, including:

- account impersonation
- mining control
- time manipulation
- state snapshots and revert

Representative examples:

- Raw RPC:
  `cast rpc eth_getBlockByNumber '["latest", false]' --rpc-url <rpc>`
- Impersonate in Anvil:
  `cast rpc anvil_impersonateAccount <address> --rpc-url <rpc>`
- Mine a block in Anvil:
  `cast rpc evm_mine --rpc-url <rpc>`
- Create snapshot:
  `cast rpc evm_snapshot --rpc-url <rpc>`

### Wallet and signing commands

These commands cover keys, local signing, and wallet workflows:

- `cast wallet`
- `cast hash-message`
- `cast recover-authority`
- `cast mktx`
- `cast publish`

From local CLI inspection, transaction-capable commands may support several wallet sources:

- raw private key
- mnemonic
- keystore / named account
- Ledger
- Trezor
- AWS KMS
- GCP KMS
- Turnkey
- browser wallet

For this skill, avoid assuming signing credentials exist unless the user explicitly provides them.

### Data conversion and utility commands

These commands are useful for general debugging, storage decoding, and payload normalization:

- `cast keccak`
- `cast concat-hex`
- `cast pad`
- `cast from-bin`
- `cast from-fixed-point`
- `cast from-rlp`
- `cast from-utf8`
- `cast from-wei`
- `cast to-ascii`
- `cast to-base`
- `cast to-bytes32`
- `cast to-check-sum-address`
- `cast to-dec`
- `cast to-fixed-point`
- `cast to-hex`
- `cast to-hexdata`
- `cast to-int256`
- `cast to-rlp`
- `cast to-uint256`
- `cast to-unit`
- `cast to-utf8`
- `cast to-wei`
- `cast parse-units`
- `cast format-units`
- `cast format-bytes32-string`
- `cast parse-bytes32-string`
- `cast parse-bytes32-address`
- `cast namehash`
- `cast lookup-address`
- `cast resolve-name`
- `cast address-zero`
- `cast hash-zero`
- `cast min-int`
- `cast max-int`
- `cast max-uint`
- `cast shl`
- `cast shr`

Examples:

- Convert ETH to wei:
  `cast to-wei 1ether`
- Convert wei to ETH:
  `cast from-wei 1000000000000000000`
- Normalize to hex:
  `cast to-hexdata <value>`
- Keccak hash:
  `cast keccak <data>`

## High-value commands for this skill

If the agent is unsure where to start, these commands are usually the highest-value defaults:

- `cast block-number`
- `cast tx`
- `cast receipt`
- `cast logs`
- `cast call`
- `cast storage`
- `cast code`
- `cast source`
- `cast calldata`
- `cast decode-calldata`
- `cast decode-event`
- `cast decode-error`
- `cast 4byte`
- `cast 4byte-event`
- `cast rpc`

## Practical selection rules

- Need chain metadata first: use `chains-reference.jsonl`
- Need latest on-chain state: use chain read commands with `--rpc-url`
- Need to inspect a transaction: start with `cast tx` and `cast receipt`
- Need to inspect contract behavior without broadcasting: start with `cast call`
- Need exact ABI-based decoding: use `cast decode-*`
- Need heuristic selector/topic lookup: use `cast 4byte*`
- Need local fork-only RPC methods: use `cast rpc`
- Need proxy inspection: use `cast admin` and `cast implementation`

## Limitations

- This reference is a curated operational summary, not a verbatim full manual
- Full command syntax still belongs to `cast --help` and `cast <subcommand> --help`
- Network-backed results can vary by RPC provider, explorer support, and upstream availability
