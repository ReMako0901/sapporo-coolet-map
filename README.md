# 札幌クールスポットマップ MVP

GitHub Pagesで公開できる静的WebアプリのMVPです。

## 動かし方

ローカル確認:

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## GitHub Pagesで公開する

1. このフォルダをGitHubリポジトリにpushする
2. リポジトリの `Settings` -> `Pages` を開く
3. `Deploy from a branch` を選ぶ
4. `main` ブランチの `/ (root)` を公開元にする

## 施設データ形式

`data/spots.geojson` の `features` に施設を追加します。

- `kind: "cool"`: 図書館、区民センター、チカホなどの涼める場所
- `kind: "toilet"`: 公園トイレ、公共施設トイレなど

座標はGeoJSON標準に合わせて `[経度, 緯度]` の順です。

## 現在取り込んでいるデータ

- 涼める場所: `札幌市クーリングシェルター一覧` と `札幌市公共施設一覧` から、図書館、区民センター、地区センター、商業施設、スーパー、ドラッグストアなどを抽出し、国土地理院住所検索で座標付け
- トイレ: `札幌市公園トイレマップ` のKMLから公園トイレを抽出
- 参考資料: 札幌市クーリングシェルター一覧PDF全区分を `data/raw/cooling/` に保存

生成済みの `data/spots.geojson` は、涼める場所225件、公園トイレ907件の合計1132件です。

## データ再生成

```bash
/Users/remako/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/build_spots.py
```

ジオコード結果は `data/raw/geocode_cache.json` に保存されます。
