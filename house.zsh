#!/usr/bin/zsh

nohup bash /home/100acresranch/house/voltage.sh &> voltage-sh.out &
nohup zsh /home/100acresranch/house/house24.zsh &> /home/100acresranch/house/house24.out &
sleep 20
nohup zsh /home/100acresranch/house/house25.zsh &> /home/100acresranch/house/house25.out &
sleep 20
nohup zsh /home/100acresranch/house/house26.zsh &> /home/100acresranch/house/house26.out &
sleep 20
nohup zsh /home/100acresranch/house/house27.zsh &> /home/100acresranch/house/house27.out &
sleep 20
nohup zsh /home/100acresranch/house/house21.zsh &> /home/100acresranch/house/house21.out &

tail -f /home/100acresranch/house/house*.out
