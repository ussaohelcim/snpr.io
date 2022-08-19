# sniper.io

```
https://boards.4channel.org/vg/thread/396615857/
#396693458
bolt action sniper game  
>spawn in random windows or other positions  
>all players have the same view but can't see their own character  
>can only see other players if zoomed in or the other player is zoomed in causing a scope glare at their position  
>can take cover behind sandbags to reload but then view is obstructed  
>kill feed with live high score  
```

# Arquitetura

- jogadores mandam para o servidor se estão escondidos ou mirando
	- se mirando
		- servidor manda posicoes de todos os jogadores que tambem estão mirando, para o jogador?
		- jogador manda a posicao do mouse
		- servidor responde 
		- servidor manda o kill feed
		- se o mouse do jogador estiver em colisao com um jogador que tambem ta mirando, servidor manda a posicao deste jogador
	- algum jogador morre
		- servidor manda para os clientes a posicao de quem morreu e o cliente espalha sangue na direcao do tiro
	- jogador atira
		- se alguem estiver onde o jogador atirou, ele morre
	- se escondido
		- servidor so manda o kill feed
