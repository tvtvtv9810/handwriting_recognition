let canvas, context;  // キャンバス
let sx, xy;           // 始点
let mouseDown = false;  // マウスボタンが押されたかどうか

// 認識文字データ（ホワイトリスト）
const whitelists = [
"0123456789",
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
"あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんー\
がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ",
"アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンー\
ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ"]

const init = () => {
  // 手書き用キャンパスの取得
  canvas = document.getElementById("note");
  context = canvas.getContext("2d");
  // ガイドの描画
  const guideCanvas = document.getElementById("guide");
  const guideContext = guideCanvas.getContext("2d");
  guideContext.setLineDash([4, 4]);
  guideContext.strokeStyle = "#3399FF";
  // > 縦線の中央に線を引く
  guideContext.beginPath();
  guideContext.moveTo(2, guideCanvas.height/2)
  guideContext.lineTo(guideCanvas.clientWidth, guideCanvas.height/2);
  guideContext.moveTo(guideCanvas.width/2, 2);
  guideContext.lineTo(guideCanvas.width/2, guideCanvas.height);
  guideContext.stroke();

  // マウスイベントの登録
  canvas.addEventListener("mousedown", startWrite);
  canvas.addEventListener("mousemove", write);
  canvas.addEventListener("mouseup", endWrite);
  canvas.addEventListener("mouseleave", endWrite);
}

const recognize = async () => {
  // 言語、文字の種類の取得
  let lang, index;
  for(const radio of document.getElementsByName("type")){
    if (radio.checked) {
       [lang, index] = radio.value.split("_");
    }
  }
  
  // Tesseractワーカーの作成
  const worker = new Tesseract.createWorker(
    {
      logger: showProgress
    }
  );
  await worker.load();
  await worker.loadLanguage(lang);
  await worker.initialize(lang)
  await worker.setParameters(
    {
      preserve_interword_space: "1",
      tessedit_pageseg_mode: "10",
      tessedit_char_whitelist: whitelists[index]
    }
  );

  // 認識
  const result = await worker.recognize(canvas);
  document.getElementById("status").innerText += "...完了";
  let [text, score] = ["--", "--"];
  if (result.data.words.length == 1){
    text = result.data.words[0].text;
    score = result.data.words[0].confidence.toFixed(2);
  }
  document.getElementById("result").value = text;
  document.getElementById("score").innerText = score;
  // 検出終了
  await worker.terminate();
}

const showProgress = packet => {
  // 進捗状況の表示
  if(packet.progress != undefined){
    const per = Math.round(packet.progress * 100);
    document.getElementById("progress").value = per;
    document.getElementById("status").innerText = packet.status;
  }
}

const startWrite = event => {
  [sx, sy] = getPoint(event);
  mouseDown = true;
}

const write = event => {
  // 手書き
  if(mouseDown){
    const [ex, ey] = getPoint(event);
    context.strokeStyle = "#000000";
    context.lineCap = "round";
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(sx, sy);
    context.lineTo(ex, ey);
    context.stroke();
    [sx, sy] = [ex, ey];
  }
}

const endWrite = event => {
  mouseDown = false;
}

const getPoint = event => {
  // マウスカーソルの位置を取得
  const canvasRect = canvas.getBoundingClientRect(); // 手書き用キャンバスの絶対座標を取得
  const x = event.clientX - canvasRect.left;
  const y = event.clientY - canvasRect.top;
  return [x, y];
}

const clearCanvas = () => {
  // キャンバスのクリア
  context.clearRect(0, 0, canvas.width, canvas.height);
}

