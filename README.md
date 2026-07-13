# Салафан — Мобил Веб Дашборд

## 📁 Файллар

| Файл | Вазифа |
|---|---|
| `index.html` | Асосий HTML — мобил интерфейс |
| `style.css` | CSS — мобил-дизайн |
| `app.js` | JavaScript — API боғланиш ва логика |

---

## ⚙️ 1С га боғлаш қадамлари

### 1. HTTP-Сервисни 1С да яратиш

Конфигуратор → `Общие` → `HTTP-сервисы` → ПКМ → `Добавить`

| Параметр | Қиймат |
|---|---|
| Имя | `WebAPI` |
| Root URL | `webapi` |

### 2. URL шаблонлари

| Шаблон | Метод | Обработчик |
|---|---|---|
| `/login` | POST | `Авторизация` |
| `/data` | GET | `ПолучитьДанные` |
| `/save_payment` | POST | `СохранитьПлатеж` |

### 3. Модул кодини кўчириш

`HTTPServices/WebAPI/Ext/Module.bsl` файлидаги кодни  
1С дagi `WebAPI` HTTP-сервиси модулига кўчиринг.

### 4. Публикация

1С → `Администрирование` → `Публикация на веб-сервере`  
- Имя публикации: `salafan`

---

## 🌐 Сайтни ишга тушириш

1. `index.html` ни браузерда очинг
2. ⚙️ тугмасини босиб созламаларни киритинг:
   - **Сервер манзили**: `192.168.1.100` (1С сервер IP)
   - **Публикация**: `salafan`
   - **Сервис**: `webapi`
3. Фойдаланувчи телефон ва паролини киритиб кириш

---

## 🔗 API Endpoints

```
POST http://HOST/salafan/hs/webapi/login
     Body: {"phone":"+998901234567","password":"1234"}

GET  http://HOST/salafan/hs/webapi/data?type=kassa_kirim&date1=2026-07-01&date2=2026-07-31
GET  http://HOST/salafan/hs/webapi/data?type=kassa_chiqim&date1=...&date2=...
GET  http://HOST/salafan/hs/webapi/data?type=tovarlar
GET  http://HOST/salafan/hs/webapi/data?type=haridorlar
GET  http://HOST/salafan/hs/webapi/data?type=taminotchilar
GET  http://HOST/salafan/hs/webapi/data?type=counterparties

POST http://HOST/salafan/hs/webapi/save_payment
     Body: {"type":"receipt","counterparty":"UUID","amount":50000,"comment":"..."}
```

---

## 👤 Фойдаланувчи қўшиш (1С да)

`Справочник.Фойдаланувчилар` да янги элемент яратинг:
- **Наименование**: Исм
- **Телефон**: +998901234567
- **Пароль**: паролingiz
- **РухсатМобил**: ✅ белгиланган бўлсин
