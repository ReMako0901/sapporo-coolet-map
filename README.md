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
