# AGENTS.md — работа с этим проектом

Проект: дизайн-макет экранов телеигры «100 к одному» в Sketch.
Единственный носитель результата — бинарный `100k1.sketch`. Читать его как текст бессмысленно;
правок через текстовые редакторы он не терпит. Все изменения делаются **сквозь запущенный Sketch**
плагином-скриптом, а затем файл сохраняется.

Описание макета — в [DESIGN.md](DESIGN.md), правила и запуск собранного веб-приложения — в [README.md](README.md).
Здесь — только механика работы с файлом.

## Состав каталога

```
100k1.sketch        результат, единственный источник истины по дизайну
README.md           веб-приложение: правила, клавиши, запуск, формат данных
DESIGN.md           что нарисовано в макете: экраны, состояния, звуки
AGENTS.md           этот файл
assets/audio/       13 mp3, имена зафиксированы
.archive/           референсы, с которых рисовали (pptx, скриншоты слайдов, jpg) + assets/ref/. Не читать.
.work/              черновики: хелперы и все скрипты правок e1…e74, скриншоты в .work/shots/
```

`.work/` и `.archive/` можно удалить без потери результата — но скрипты `e47.js` (ресайз),
`e51.js` (цвета), `e54.js`/`e64.js` (переходы) полезны как эталоны.

## Окружение shell

- `cat` в этом профиле алиаснут на `bat`, которого нет в PATH → `command not found: bat`.
  Файлы читать инструментом Read, не `cat`.
- `node` отсутствует. Для разбора JSON и ZIP — `python3` (печатает предупреждение safe-chain,
  его игнорировать).
- `.sketch` — это ZIP. Быстрый инспект без Sketch:
  ```bash
  unzip -p 100k1.sketch pages/*.json | python3 -m json.tool | head
  ```
  Классы слоёв в JSON строчными: `text`, `shapeGroup`, `rectangle`, `group`, `bitmap`.

## Инструменты

Sketch поднимает локальный MCP-сервер. Он **не** зарегистрирован в Qoder как MCP, поэтому обращения
идут сырым JSON-RPC через `curl`. Два готовых хелпера лежат в `.work/`:

```bash
cd /Users/rgainanov/code/sbx/100k1/.work

./sketch_mcp.sh list                       # инструменты сервера
./sketch_mcp.sh guide <topic>              # документация по API Sketch
./sketch_mcp.sh <toolName> '<json-args>'   # любой вызов; картинки пишет в .work/shots/

./rc.sh script.js "название"               # прогнать JS-файл как плагин через run_code
```

Порт (`http://localhost:31126/mcp`) живёт до перезапуска Sketch — если ответы пропали, сначала
`curl -s http://localhost:31126/mcp` и уточнить порт через `lsof -i -n | grep -i sketch`.

Инструменты сервера: `get_document_info`, `get_layer_tree_summary`, `get_screenshot`, `run_code`,
`get_guide`, `get_libraries`, `get_design_assets`, `get_symbol_overrides`.

У `get_screenshot` аргументы **`targetDocumentID` + `layerID`**. `targetID` не работает — сервер
ответит «No selected layers or no layers with such identifier». `targetDocumentID` — это UUID из
`get_document_info`, а не имя файла.

## Рабочий цикл

1. `./sketch_mcp.sh get_document_info '{}'` → UUID документа и артбордов.
2. Написать скрипт в `.work/eNN.js` (нумерация сквозная, текущий хвост — `e74.js`).
3. `./rc.sh eNN.js "что делает"`.
4. `get_screenshot` изменённого артборда → **прочитать PNG глазами** через Read.
5. Только после визуальной проверки — `doc.save()`.

Пропуск шага 4 стоит дороже, чем кажется: `run_code` рапортует об успехе, даже когда ничего не
изменилось (см. «цвета» ниже).

## Неочевидное в Sketch API

Это то, что здесь реально сломало время. Всё проверено на этом файле.

- **Цвета текста.** `layer.style.textColor = '#FFF'` присваивается без ошибки, геттер возвращает
  новое значение, а на канвасе остаётся старый цвет — текст берёт цвет из **fill**, а не из style.
  Правильно:
  ```javascript
  const f = l.style.fills
  f[0].color = '#FFFFFFFF'   // всегда с альфа-каналом, 8 hex
  l.style.fills = f          // массив нужно переприсвоить
  ```
- **Дубликаты-клоны наследуют проблемы оригинала.** Если донор имел run-level цвет, клон будет
  тёмным навсегда. Чинить донора или брать другой донор, а не клон.
- **Порядок в стеке решает всё.** Текст под плашкой невидим. После создания слоёв —
  `layer.moveToFront()`.
- **`layer.duplicate()` возвращает сам слой, не массив.** `duplicate()[0]` → `TypeError: undefined
  is not an object`.
- **Текст игнорирует `frame.width`**, пока авто-ширина. Нужно:
  ```javascript
  l.fixedWidth = true
  l.frame.width = 760
  l.style.alignment = 'left'
  ```
- **`sketch.Text.TextMode` не существует** — не искать.
- **Изменение высоты артборда пропорционально сдвигает слои.** После `frame.height = 1080`
  заново расставить заголовок и подзаголовок, иначе они наедут на таблицу.
- **Ресайз фигуры требует правки и вложенного пути.** Иначе плашка остаётся прежнего размера
  внутри нового frame:
  ```javascript
  shape.frame.width = w; shape.frame.height = h
  sketch.find('ShapePath', shape).forEach(p => {
    p.frame.x = 0; p.frame.y = 0; p.frame.width = w; p.frame.height = h
    p.points.forEach(pt => { pt.cornerRadius = 14 })
  })
  ```
  Готовый хелпер — `.work/e47.js`.
- **ASI-ловушка.** ECMAScript в плагине: строка, начинающаяся с `[`, после предыдущей без
  точки с запятой, склеивается в индексирование → `undefined is not an object`. Массив-литерал
  сначала в `const`.
- **`page.canvas` — это bounding box, не слои.** Список артбордов: `page.canvasLevelFrames`.
- **`sketch.find('[name="X"]', doc)`** работает; `sketch.find('#<objectID>', doc)` — тоже.
- **`console.log(JSON.stringify(...))`** — так скрипт возвращает данные наружу.

## Прототип

`layer.flow` присваивается объектом целиком, частичная запись не работает:

```javascript
const slide = sketch.Flow.AnimationType.slideFromRight

// переход на артборд — target это сам слой-артборд
layer.flow = { target: targetArtboard, animationType: slide, maintainScrollPosition: false }

// возврат на предыдущий экран — BackTarget передаётся значением, без new
layer.flow = { target: sketch.Flow.BackTarget, animationType: sketch.Flow.AnimationType.none,
               maintainScrollPosition: false }

artboard.flowStartPoint = true    // ровно на одном артборде
```

Читать назад: `layer.flow.targetId` (в JSON это `destinationArtboardID`, возврат — `'--'`).
Готовый граф из 16 рёбер лежит в `.work/e54.js` и `.work/e64.js`.

## Соглашения об именовании слоёв

Имя несёт смысл: по нему ищут слои скрипты, по нему читается макет.

| Маска | Что |
|---|---|
| `BG-<назначение>` | фон: `BG-Волны`, `BG-Скрим`, `BG-Логотип-100к1`, `BG-Полотно` |
| `Кнопка-<название>` / `-Текст` | плашка и её подпись отдельным слоем |
| `Карточка-N-{Плашка,Ответ,Баллы,Номер}` | строка табло, N = 1…6 сверху вниз |
| `Кнопка-x-{жёлтая,плечо,использовано}-N` | счётчик промахов |
| `Счёт-N-{Плашка,Текст}` | очки команды на меню |
| `Заголовок-Режим`, `Описание-Режима` | текст на заставке раунда |
| `Строка-R-C`, `Шапка-C`, `Линия-R` | ячейки таблицы спеки |

Слои-состояния не переименовывать и не группировать иначе — на имена завязаны скрипты правок.

## Токены дизайна

```
ink        #16202E   slate      #4A6B8A   gold       #F2C230
gold-dark  #C79A18   brick      #9E3A2B   teal-dark  #14535F
x-red      #B33025   scrim      #1E2647   spec-bg    #101826
rule       #2A3A52
```
Радиусы: 14 — карточки, 10 — плашки, кнопки, счётчики. Шрифт PT Sans, жирное — `PTSans-Bold`.
Экраны 1280×720; спека 1280×1080.

## Ограничения

- **Не менять дизайн, когда просят только текст.** Композиция, палитра и раскладки согласованы;
  правка «по ходу дела» — работа на выброс.
- **`assets/audio/` не трогать**: имена файлов зафиксированы, на них ссылаются спека и правила.
- **Ссылки на внешние картинки в `.sketch` должны отсутствовать.** Проверить после любой правки
  фонов:
  ```bash
  unzip -p 100k1.sketch '*.json' | grep -c '/Users/'   # обязано быть 0
  ```
- Референсы, с которых рисовали, лежат в `.archive/assets/` — это мусор, не источник истины.
  Оригинал — только `100k1.sketch`.
- Скрипты в `.work/` — черновики. Каждый `eNN.js` одноразовый: не переписывать его под новую
  задачу, а заводить следующий номер.

## Типовые ошибки

| Сообщение | Причина |
|---|---|
| `No open Sketch documents with such identifier` | в `targetDocumentID` попало имя файла вместо UUID |
| `No selected layers or no layers with such identifier` | неверное имя параметра слоя или слой удалён |
| `TypeError: undefined is not an object` | `duplicate()[0]`, либо ASI с `[` на новой строке |
| Правка прошла, на скриншоте ничего не изменилось | цвет был в fill, а писался в `style.textColor` |
