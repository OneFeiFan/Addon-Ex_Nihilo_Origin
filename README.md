# 无中生有·起源 Ex Nihilo Origin（基岩版）

InnerCore 模组「无中生有·起源」2.3.2 的基岩版移植（原作：Hunter(强颜欢笑)、非凡、桃乐丝），用 [Sapdon](https://www.npmjs.com/package/sapdon) 构建。2.4 起按现在的原版内容重新设计了筛子、盐和铜。

- 运行：基岩版 1.26.50 及以上，不需要实验开关
- 改动说明：[与原模组的差异.md](与原模组的差异.md)
- 开发说明（目录、工具、已知问题）：[开发说明.md](开发说明.md)

## 构建

需要 Node.js 22.6 及以上，详细步骤见 [编译教程.md](编译教程.md)。

```
npm install
npm run release    # 构建 + 测试 + 打包 → dev/eno-port.mcaddon
```
