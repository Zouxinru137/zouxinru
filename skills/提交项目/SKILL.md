# Skill：提交项目（git commit + push 到 Gitee）

用途：把本仓库（webprojectzouxinru）的最新改动提交并推送到 Gitee 远程仓库。

## 仓库信息

- 远程地址：`https://gitee.com/zou-xinru/wangye-website.git`（远程名 `origin`，分支 `master`）
- 认证方式：Gitee 私人令牌已内嵌在**本地** `.git/config` 的 origin 远程 URL 中（`https://zou-xinru:<私人令牌>@gitee.com/...`）。
  令牌只存在本地配置里，**绝不写入任何会被提交的文件**（SKILL.md、源码、提示词记录都不放令牌）。

## 执行步骤

1. 进入仓库根目录：`c:\Users\ag601\Desktop\网页\000zouxinru\webprojectzouxinru`
2. `git status` 查看变更，确认没有敏感文件（令牌、密钥等）混入。
3. `git add` 逐个添加要提交的文件（删除的文件用 `git add <已删除路径>` 同步删除记录）。
4. `git commit -m "<简短中文说明>"`，消息风格与历史一致（如「新增图标工坊练习页面」）。
5. `git push origin master` 推送到 Gitee。
6. `git status` / `git log --oneline -3` 确认推送成功。

## 认证失效时

若 push 返回 401/403，说明令牌过期或更换，用新令牌重设远程（在 PowerShell 中执行）：

```
git remote set-url origin https://zou-xinru:<新的私人令牌>@gitee.com/zou-xinru/wangye-website.git
```

## 注意事项

- 提交前浏览 `git status` 的未跟踪文件，确认要一并纳入。
- 本文件与令牌分离：更新令牌只需改 `.git/config`，无需改本文件。
