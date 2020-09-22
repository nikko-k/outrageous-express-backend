Проекта се пуска с "docker-compose up"
Бекенда се рестартира автоматично при промяна на файловете.

За да се запазват данните от Mongo базата данни: 
1. "docker volume mongodbdata" за да създаде volume
2. "docker cp mongodbdata:/data/db ./mongo" за да копне данните от volume-а в папката

и съответно обратното: "docker cp "./db_backup" mongo_database:/data/db"

Цялата тая гимнастика е заради проблем на mongo с windows и мак. На линукс става доста по-лесно.