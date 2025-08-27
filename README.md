
## Como rodar o projeto

1. Instale o Node.js (recomendado versão 18 ou superior).
2. No terminal, navegue até a pasta do projeto:
	```powershell
	cd DemonstrativoDeAfericao
	```
3. Instale as dependências:
	```powershell
	npm install
	```

### Para rodar em modo produção (preview):

4. Gere a build do projeto:
	```powershell
	npm run build
	```
5. Execute o preview com Vite:
	```powershell
	npx vite preview [--host] [--port <PORTA>]
	```
	- O argumento `--host` permite acessar de outros dispositivos na rede.
	- O argumento `--port <PORTA>` define a porta desejada (exemplo: `--port 8080`).
	- Se não especificar a porta, o Vite escolherá uma automaticamente.
