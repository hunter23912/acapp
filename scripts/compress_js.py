import os

js_path = os.path.expanduser('./game/static/js')
src_dir = os.path.join(js_path, 'src')
dist_dir = os.path.join(js_path, 'dist')
dist_file = os.path.join(dist_dir, 'game.js')

# 确保 dist 目录存在
os.makedirs(dist_dir, exist_ok=True)

# 获取所有 .js 文件，按文件名排序
js_files = []
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.js'):
            js_files.append(os.path.join(root, file))
js_files.sort()

# 合并内容写入 dist/game.js
with open(dist_file, 'w', encoding='utf-8') as outfile:
    for file in js_files:
        with open(file, 'r', encoding='utf-8') as infile:
            outfile.write(infile.read())
            outfile.write('\n')
print(f"合并完成，共 {len(js_files)} 个文件，输出到 {dist_file.replace(os.sep, '/')}")