# Skill：提交到 GitHub（git commit + push）

用途：把本仓库（webprojectzouxinru）的最新改动提交并推送到 GitHub 远程仓库。

## 仓库信息

- 远程地址：`ssh://git@ssh.github.com:443/Zouxinru137/zouxinru.git`（远程名 `github`，分支 `master`）
  - **不要用** `git@github.com:...` 形式：本机网络封锁 22 端口（Connection refused），必须走 `ssh.github.com:443`。
  - 该地址已直接写入远程 `github`，无需 ~/.ssh/config。
- 认证方式：**SSH 公钥**。本地密钥位于 `C:\Users\ag601\.ssh\id_ed25519`（私钥）/ `id_ed25519.pub`（公钥），公钥已添加到 GitHub 账户 Zouxinru137。
- 与 Gitee 互不干扰：`origin` 指向 Gitee，`github` 指向 GitHub，两个远程各自独立推送。

## 执行步骤

1. 进入仓库根目录：`c:\Users\ag601\Desktop\网页\000zouxinru\webprojectzouxinru`
2. `git status` 查看变更，确认没有敏感文件混入。
3. `git add` 逐个添加要提交的文件（删除的文件用 `git add <已删除路径>` 同步删除记录）。
4. `git commit -m "<简短中文说明>"`，消息风格与历史一致。
5. `git push github master` 推送到 GitHub（SSH 协议需在非沙箱终端执行）。
6. `git status` / `git log --oneline -3` 确认推送成功。

## 首次连接 / 地址修复

- 信任 ssh.github.com 主机密钥（首次推送时对主机密钥提示选 yes，或）：

  ```
  ssh -oStrictHostKeyChecking=accept-new -T git@ssh.github.com -p 443
  ```

  成功会显示 `Hi Zouxinru137!`。
- 若远程地址被改回 22 端口形式，用下面命令修复：

  ```
  git remote set-url github ssh://git@ssh.github.com:443/Zouxinru137/zouxinru.git
  ```

## 常见问题排查

- **Connection refused（github.com:22）**：网络封锁 22 端口，确认远程地址为上面的 443 形式。
- **Permission denied (publickey)**：公钥未添加到 GitHub。用上面的 ssh -T 命令验证。
- **远程仓库为空**：直接 `git push -u github master` 即可建立跟踪。
- **远程有新提交**：先 `git fetch github` 查看差异，再决定合并方式（勿直接强推）。

## 注意事项

- 本项目同时维护 Gitee（origin）与 GitHub（github）两个远程，推送哪个按用户要求执行，不要盲目双推。
- 提交前浏览 `git status` 的未跟踪文件，确认要一并纳入。
