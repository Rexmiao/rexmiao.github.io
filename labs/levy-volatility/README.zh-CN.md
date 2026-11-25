# Lévy 波动率实验室

[English](README.md) · **简体中文**

本项目用美元兑日元日度汇率构造波动率代理，再拟合 Lévy 驱动的 Ornstein–Uhlenbeck（OU）方差模型。网页可以查看训练和检验区间、比较样本外预测，并观察正跳跃及其随时间衰减的过程。

## 本地运行

使用 Python 3.10 或更新版本，在本目录执行：

```powershell
python scripts/model.py
python -m http.server 8080 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8080/`。第一个命令从随项目提供的 `data/observations.csv` 重建 `data/results.json`。线上和本地网页读取同一份结果文件。

## 数据与模型

汇率来自美联储 H.10 的纽约中午参考报价，单位为每美元对应的日元数。用六次有效报价计算最近五次对数变化，再将平方均值乘以 252，得到年化方差代理。数据范围、字段及来源见[数据说明](data/DATA.md)。

模型用正的指数分布跳跃描述波动冲击，并让方差在冲击之间以 λ 的速率衰减。跳跃按齐次泊松过程到达。平稳分布为 Gamma，形状参数 k、尺度 θ、均值 m = kθ，跳跃率为 λk。前 80% 的观测用于估计平稳矩和一期持续性。测试阶段固定已估参数，每次预测只读取预测起点已知的观测。

在预测期限 h，条件期望方差为 m + (Vₜ − m) exp(−λh)。网页将它与衰减系数 0.94 的 EWMA 和持平预测比较。三种模型预测同一个目标，即未来指定观测日结束时的五期方差代理。QLIKE 按方差计算，RMSE 按年化波动率计算，数值越小代表样本外误差越低。

一期预测的起点与目标有四期收益率重叠。五期和 22 期预测的起点和目标不重叠，连续的检验目标之间仍有重叠。模型直接把方差代理当作状态。当一笔较大的旧收益率退出窗口时，观测方差可能降到模型预测区间以下。相同均值和持续性的 AR(1) 会给出同样的点预测。可通过区间覆盖率检验跳跃分布。

## 参考

- [美联储 H.10 日元历史汇率](https://www.federalreserve.gov/releases/h10/hist/dat00_ja.htm)
- [Barndorff-Nielsen 与 Shephard 的 Lévy–OU 模型论文](https://ora.ox.ac.uk/objects/uuid:19a83a30-f460-4c6e-8cb9-f59da3016c56)
- [Patton 的波动率预测误差比较论文](https://public.econ.duke.edu/~ap172/Patton_vol_proxies_JoE_2011.pdf)
