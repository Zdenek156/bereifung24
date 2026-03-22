filepath = '/var/www/bereifung24/app/HomePage.tsx'

with open(filepath, 'r') as f:
    content = f.read()

marker_start = '{/* Standorte - SEO Internal Links */}'
marker_end = '{/* Bottom Bar */}'

start = content.find(marker_start)
stop = content.find(marker_end)

if start > 0 and stop > 0:
    before = content[:start]
    after = content[stop:]
    content = before + after
    with open(filepath, 'w') as f:
        f.write(content)
    print('Standorte section removed successfully')
else:
    print(f'Not found: start={start}, stop={stop}')
