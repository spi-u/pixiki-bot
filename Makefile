up-dev:
	docker-compose -f docker-compose.dev.yml up -d --build
up-prod:
	docker-compose -f docker-compose.prod.yml up -d --build
down-dev:
	docker-compose -f docker-compose.dev.yml down
down-prod:
	docker-compose -f docker-compose.prod.yml down
logs:
	docker logs --follow --tail 500 pixiki-bot
ps-logs:
	docker logs --follow pixiki-bot-db