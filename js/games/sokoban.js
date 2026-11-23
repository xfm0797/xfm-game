/* ==========================================================
   sokoban.js — 推箱子（155 关）
   ========================================================== */
(function () {
  "use strict";

  const SOKOBAN_LEVELS = [
  {t:0,b:16,r:["########","#.    .#","#      #","# $@$ ##","#      #","########"]},
  {t:0,b:16,r:["########","#      #","# @$  .#","# $    #","#      #","#  #  .#","########"]},
  {t:0,b:16,r:["########","#  #   #","#      #","# $  $ #","# @    #","# . .  #","########"]},
  {t:0,b:16,r:["#######","#     #","# $   #","# # $.#","#   @ #","# .   #","#######"]},
  {t:0,b:16,r:["########","#      #","#  $ $@#","#     ##","#. .   #","########"]},
  {t:0,b:16,r:["#######","#     #","# @   #","#.$   #","#  #$.#","#     #","#######"]},
  {t:0,b:16,r:["########","#.   # #","#      #","# @$   #","# .  $ #","#      #","########"]},
  {t:0,b:16,r:["########","#     .#","#      #","# $  $ #","#    @.#","#      #","########"]},
  {t:0,b:16,r:["########","#  .  .#","# $    #","#    $@#","#  #   #","########"]},
  {t:0,b:17,r:["####","#  ####","# . . #","# $$#@#","##    #"," ######"]},
  {t:0,b:17,r:["  ####"," ##  #","##@$.##","# $$  #","# . . #","###   #","  #####"]},
  {t:0,b:17,r:["########","#      #","#  $   #","#    $ #","#.   @ #","# .   ##","########"]},
  {t:0,b:17,r:["#######","#     #","#  $@ #","#    .#","#  # $#","#  .  #","#######"]},
  {t:0,b:17,r:["#######","#.    #","#   @ #","#.# $ #","#$    #","#     #","#######"]},
  {t:0,b:17,r:["########","#    . #","#   $  #","# $ # .#","# @    #","########"]},
  {t:0,b:17,r:["#######","#  .  #","#   $##","#     #","#  $@ #","#  .  #","#######"]},
  {t:0,b:17,r:["########","#      #","#     $#","# $ #  #","# @ . .#","########"]},
  {t:0,b:17,r:["########","#.  $@ #","#      #","# $# . #","#      #","########"]},
  {t:0,b:17,r:["########","#      #","#  @$  #","#      #","#. . $ #","########"]},
  {t:0,b:17,r:["#######","# . @ #","#   $.#","#     #","# $   #","# #   #","#######"]},
  {t:0,b:18,r:["########","#     .#","# $    #","#   $@ #","##    .#","########"]},
  {t:0,b:18,r:["#######","#     #","#.$#@ #","#   $ #","#     #","#  .  #","#######"]},
  {t:0,b:18,r:["########","#.     #","#@$    #","#      #","#    $ #","#.     #","########"]},
  {t:0,b:20,r:[" #####"," #   #","##   ##","# $$$ #","# .+. #","#######"]},
  {t:0,b:20,r:["########","# .  $ #","#  @$  #","#.   # #","#      #","########"]},
  {t:0,b:21,r:["####","#  ###","# $$ #","#... #","# @$ #","#   ##","#####"]},
  {t:0,b:21,r:["#########","#    .  #","#.$  $@ #","#  #    #","#  . #. #","#  $    #","#       #","#     $ #","#       #","#########"]},
  {t:0,b:22,r:["#########","##@    .#","# $   $ #","#       #","#      $#","#    .  #","#  .    #","#########"]},
  {t:0,b:22,r:["#########","#   .   #","# $    .#","#  .#   #","#  $@ $ #","#      ##","#########"]},
  {t:0,b:22,r:["########","#.     #","# .@ . #","# $$   #","#      #","# #  $ #","#      #","########"]},
  {t:0,b:22,r:["#########","#       #","#  . $  #","# $ . . #","# @     #","# $    ##","#       #","#########"]},
  {t:1,b:22,r:["########","#      #","#  $ $ #","#. #   #","#  .$@ #","#.     #","#      #","########"]},
  {t:1,b:22,r:["########","# . @. #","#   $  #","# $  . #","#      #","# $    #","#      #","########"]},
  {t:1,b:23,r:["#####","#   ###","#  $  #","##* . #"," #   @#"," ######"]},
  {t:1,b:23,r:["########","#      #","# .**$@#","#      #","#####  #","    ####"]},
  {t:1,b:23,r:["#########","#     . #","# $     #","#  #  . #","# $   $ #","#  .  @ #","#########"]},
  {t:1,b:23,r:["#########","#       #","#    $  #","#  .    #","#     $ #","#    $@ #","#.     .#","#########"]},
  {t:1,b:23,r:["#########","#     . #","#     $ #","# $   # #","#. $+   #","#       #","#########"]},
  {t:1,b:23,r:["#########","#.      #","#  $@ $ #","#  .$ # #","#       #","#.    # #","#       #","#########"]},
  {t:1,b:23,r:["########","#     .#","#     $#","#   $  #","# # @ .#","# $    #","#     .#","########"]},
  {t:1,b:23,r:["#########","# .     #","#  #    #","#.  $ $ #","#   @  ##","#    .$ #","#       #","#########"]},
  {t:1,b:23,r:["##########","#        #","#   @$. $#","##       #","#    $  .#","#.     . #","#      $ #","#  #     #","##########"]},
  {t:1,b:23,r:["##########","#     #  #","# #    $ #","#   .   .#","#    $#$ #","#    @.  #","#   . $  #","#        #","##########"]},
  {t:1,b:23,r:["##########","#      . #","#        #","#  .$@$  #","# .      #","# $  $   #","#    #   #","# .      #","##########"]},
  {t:1,b:24,r:["#########","#       #","#.  + $ #","#  .$ # #","#     $ #","#       #","#########"]},
  {t:1,b:24,r:["#########","#  .    #","# $   @ #","#     $ #","#  #    #","# # .   #","# $  .  #","#########"]},
  {t:1,b:24,r:["#########","#       #","#       #","#.      #","#       #","# ##    #","# $  .$ #","#@$     #","# $ .  .#","#########"]},
  {t:1,b:25,r:["#####","# @ #","#...#","#$$$##","#    #","#    #","######"]},
  {t:1,b:25,r:[" #######"," #     #"," # .$. #","## $@$ #","#  .$. #","#      #","########"]},
  {t:1,b:25,r:["#########","#       #","#   @$  #","#.      #","#  .    #","#     $ #","#   . $ #","#########"]},
  {t:1,b:25,r:["#########","#       #","#  $    #","#  # $# #","#    @  #","#.      #","# .$   .#","#########"]},
  {t:1,b:25,r:["#########","#      .#","#   $   #","#  #    #","#.$     #","#    .  #","#       #","# $@$   #","#    .  #","#########"]},
  {t:1,b:25,r:["#########","# .     #","#       #","# $@ .  #","#  $ #$ #","#    #  #","# .     #","# $   . #","#########"]},
  {t:1,b:25,r:["##########","##       #","#   .    #","#      $ #","# $.     #","#      $ #","# .     .#","#    @$  #","#        #","##########"]},
  {t:1,b:26,r:["  ####","### @#","#  $ #","#  *.#","#  *.#","#  $ #","###  #","  ####"]},
  {t:1,b:26,r:["#########","#      .#","# $  .  #","#       #","# $@$   #","#      .#","#########"]},
  {t:1,b:26,r:["########","#. $@  #","#      #","#.#  # #","#    $ #","#.   $ #","########"]},
  {t:1,b:26,r:["#########","#       #","# $# $@ #","#       #","#     . #","#   . $ #","#  .    #","#########"]},
  {t:1,b:26,r:["#########","#       #","##$$    #","#  .   .#","#       #","# $     #","# @# .  #","#########"]},
  {t:1,b:26,r:["#########","#   # .##","#  $    #","#      .#","#  $    #","#.      #","#$      #","#@$   . #","#########"]},
  {t:1,b:26,r:["#########","#      .#","# . $ $ #","# $   . #","# @#   .#","#       #","# $     #","#       #","#########"]},
  {t:1,b:26,r:["#########","#       #","# $ .$  #","##      #","#       #","#   .   #","#  $ .  #","#  @  $ #","#    .  #","#########"]},
  {t:2,b:27,r:["#########","#       #","#  $ $ ##","#       #","#.      #","#   @$. #","#.     ##","#########"]},
  {t:2,b:27,r:["#########","# .   $ #","#.    $ #","#     # #","# $     #","# @     #","#      .#","#########"]},
  {t:2,b:27,r:["##########","#  .     #","# $ .    #","#    $   #","# $  . # #","##       #","#       .#","#   $    #","#   @ #  #","##########"]},
  {t:2,b:27,r:["#########","#       #","#  $ #  #","#  .    #","#    .  #","#     $ #","# $$. + #","# #     #","#########"]},
  {t:2,b:27,r:["##########","#        #","#        #","#        #","#  .   @ #","#   #  $##","#  .$ #  #","#    $   #","# $  .  .#","##########"]},
  {t:2,b:28,r:["#########","#    . .#","# $     #","#   @$  #","#    .  #","# $     #","#       #","#########"]},
  {t:2,b:28,r:["########","#      #","# $$ . #","# # .  #","#   $@.#","#      #","########"]},
  {t:2,b:28,r:["#########","#       #","#$$     #","#.#    ##","#       #","#@$     #","#    .  #","# . . $ #","#       #","#########"]},
  {t:2,b:28,r:["##########","#     .  #","#.   $  .#","#       ##","#        #","#    $   #","#  $ +$  #","#        #","##########"]},
  {t:2,b:28,r:["##########","#        #","# #      #","#.     # #","#    .   #","#  . $ $ #","#      @ #","#   $$   #","#.      ##","##########"]},
  {t:2,b:28,r:["#########","#       #","# $$  . #","#      .#","#     $ #","#  +$   #","#   # # #","# .     #","#########"]},
  {t:2,b:29,r:["#########","#       #","#   .#$ #","#    #  #","#@$     #","#  .    #","#.    $ #","#########"]},
  {t:2,b:29,r:["########","#   .$ #","# .  # #","# $  @ #","# #  $ #","#      #","#   .  #","########"]},
  {t:2,b:29,r:["#########","#      .#","# $   . #","#     $@#","#      $#","# # $ . #","#.  # # #","#       #","#########"]},
  {t:2,b:29,r:["##########","#.       #","# # . $  #","#.       #","#$.      #","# $      #","#      $@#","#        #","##########"]},
  {t:2,b:29,r:["##########","#        #","#  .     #","# $      #","#   $ $  #","# # @   .#","# .  $   #","#       .#","##########"]},
  {t:2,b:30,r:["#####","#.  ##","#@$$ #","##   #"," ##  #","  ##.#","   ###"]},
  {t:2,b:30,r:["  ####","###  ####","#       #","#@$***. #","#       #","#########"]},
  {t:2,b:30,r:["#########","#  #    #","# $ $   #","#     . #","#       #","#   $   #","#   +  .#","#########"]},
  {t:2,b:30,r:["#########","#  .    #","#     $ #","#       #","#.   .# #","#       #","#  @$ $ #","#       #","#########"]},
  {t:2,b:30,r:["########","#     ##","#    $ #","#      #","#.#    #","#      #","# @$ $ #","#. .   #","########"]},
  {t:2,b:30,r:["#########","# .     #","# $   $ #","#       #","# .   # #","#       #","#  #@$  #","# .     #","#########"]},
  {t:2,b:30,r:["########","#    . #","# $   .#","# @  . #","#      #","# $$   #","#      #","#     ##","########"]},
  {t:2,b:30,r:["#########","#       #","#  $  # #","#      $#","#     .@#","#       #","#    $. #","##     .#","#########"]},
  {t:2,b:30,r:["#########","#      .#","#       #","#  #  . #","#  $    #","#       #","# $ $ # #","# @   . #","#########"]},
  {t:2,b:30,r:["########","#   #  #","#    $ #","#   $  #","#   .  #","#  $ # #","#  @   #","#.   . #","########"]},
  {t:2,b:30,r:["########","#      #","##$  $@#","#    #.#","#    . #","#      #","#      #","# $   .#","########"]},
  {t:2,b:30,r:["#########","#       #","# $# $  #","#       #","#      .#","#       #","# @$   .#","#    .  #","#########"]},
  {t:2,b:30,r:["#########","#       #","#. .$@  #","#    $# #","#       #","#.# $   #","#       #","#########"]},
  {t:2,b:30,r:["#########","#       #","# $ #   #","#     $ #","#     @ #","#       #","#.   .$ #","#   .   #","#########"]},
  {t:2,b:30,r:["#########","# .    .#","#     # #","#       #","#   $ $ #","#     . #","#       #","#   $@ $#","#.      #","#########"]},
  {t:3,b:31,r:["########","# . . .#","#      #","#    $ #","#    @##","#      #","# $  $ #","#      #","########"]},
  {t:3,b:31,r:["#########","#    .@ #","#     $ #","#       #","#  .#   #","# $$    #","# #  .  #","#########"]},
  {t:3,b:31,r:["########","# @.  .#","# $    #","#      #","# $   .#","#  #   #","# $    #","#      #","########"]},
  {t:3,b:31,r:["#########","#       #","#  $   $#","##      #","#    $  #","#    @  #","#   .  .#","#.      #","#########"]},
  {t:3,b:32,r:["#########","#     # #","# $  $@ #","#       #","# $ .  .#","#       #","#    .  #","#########"]},
  {t:3,b:33,r:["#####","#   #","# @ #","# $$###","##. . #"," #    #"," ######"]},
  {t:3,b:33,r:["####","# .#","#  ###","#*@  #","#  $ #","#  ###","####"]},
  {t:3,b:33,r:["########","#      #","#$$#   #","#   #$ #","#    @ #","#     .#","#      #","#.  .  #","########"]},
  {t:3,b:33,r:["#########","#       #","#@$    .#","#   #.  #","#    # .#","# $ $   #","#       #","#########"]},
  {t:3,b:33,r:["#########","#       #","#. # $ ##","#  .  $ #","#.      #","#   @$  #","#       #","#########"]},
  {t:3,b:33,r:["#########","#     # #","#     $ #","#.   #$ #","# @     #","# $.    #","#       #","#  .    #","#########"]},
  {t:3,b:33,r:["#########","#       #","#     $ #","#       #","#.      #","#   @$  #","#.    # #","# . $   #","#########"]},
  {t:3,b:33,r:["##########","#        #","# $   .$ #","#  .     #","# @$    ##","#      $ #","#     .  #","#       .#","##########"]},
  {t:3,b:34,r:["####","#  ###","#    ###","#  $*@ #","### .# #","  #    #","  ######"]},
  {t:3,b:34,r:["#########","#       #","#$ $ #$ #","#   .  .#","#.   .# #","#@$     #","#       #","#########"]},
  {t:3,b:34,r:["#########","#       #","#    $@ #","#   .   #","#.      #","# . $   #","#     # #","#.  $ $ #","#       #","#########"]},
  {t:3,b:34,r:["##########","#     # .#","# $.     #","#        #","#        #","#        #","#. .$    #","#     $@$#","#   #    #","##########"]},
  {t:3,b:35,r:[" ####","##  ###","#     #","#.**$@#","#   ###","##  #"," ####"]},
  {t:3,b:35,r:["# #####","  #   #","###$$@#","#   ###","#     #","# . . #","#######"]},
  {t:3,b:35,r:["########","#   @  #","#   $  #","#  . #.#","#.     #","# $  $##","#      #","########"]},
  {t:3,b:35,r:["##########","#      . #","#$ $@    #","#.    .  #","#      # #","#      . #","#  $ $   #","#        #","##########"]},
  {t:3,b:35,r:["#########","#       #","# $  $ $#","##      #","#      .#","#  +$.  #","#       #","#     #.#","#  #    #","#########"]},
  {t:3,b:35,r:["#########","#  # .  #","#  .    #","#      .#","# $  # ##","#     $ #","# $ @$  #","#.      #","#########"]},
  {t:3,b:36,r:["#########","#       #","#  $@ $ #","# #     #","#     $ #","#  .    #","#.      #","#  .#   #","#########"]},
  {t:3,b:36,r:["#########","#       #","# $ # $ #","#       #","#       #","#     $ #","#.    @ #","# . .  ##","#########"]},
  {t:3,b:36,r:["#########","#  .    #","# @  .#$#","# $     #","##     .#","#       #","#       #","#   $ $ #","#.      #","#########"]},
  {t:3,b:37,r:["     ###","######@##","#    .* #","#   #   #","#####$# #","    #   #","    #####"]},
  {t:3,b:37,r:[" #####","##. .##","# * * #","#  #  #","# $ $ #","## @ ##"," #####"]},
  {t:3,b:37,r:["##########","#        #","# ##.### #","# # $$ . #","# . @$## #","#####    #","    ######"]},
  {t:3,b:39,r:["##########","#.     $ #","#      $ #","#      @ #","#      $ #","#. #     #","#  .   . #","#    $   #","#        #","##########"]},
  {t:3,b:41,r:["########","#   .. #","#  @$$ #","##### ##","   #  #","   #  #","   #  #","   ####"]},
  {t:4,b:41,r:[" #####"," # @ #"," #   #","###$ #","# ...#","# $$ #","###  #","  ####"]},
  {t:4,b:41,r:["  ####","###  ####","#     $ #","# #  #$ #","# . .#@ #","#########"]},
  {t:4,b:41,r:["#######","#. #  #","#  $  #","#. $#@#","#  $  #","#. #  #","#######"]},
  {t:4,b:44,r:["####","#  ####","#.*$  #","# .$# #","## @  #"," #   ##"," #####"]},
  {t:4,b:44,r:["##########","#        #","#  $ # $ #","#        #","#.   @$  #","#  .     #","#   #  $ #","#   .    #","# .      #","##########"]},
  {t:4,b:47,r:[" ######","##    #","#  ## #","# # $ #","#  * .#","## #@##"," #   #"," #####"]},
  {t:4,b:47,r:["   ####","   #  #","   #@ #","####$.#","#   $.#","# # $.#","#    ##","######"]},
  {t:4,b:47,r:["#####","#   ###","#. .  #","#   # #","## #  #"," #@$$ #"," #    #"," #  ###"," ####"]},
  {t:4,b:50,r:["######","#   .#","# ## ##","#  $$@#","# #   #","#.  ###","#####"]},
  {t:4,b:52,r:["####","#. ##","#.@ #","#. $#","##$ ###"," # $  #"," #    #"," #  ###"," ####"]},
  {t:4,b:56,r:["#######","#  *  #","#     #","## # ##"," #$@.#"," #   #"," #####"]},
  {t:4,b:60,r:["  ####","  #  #","  #@ #","  #  #","### ####","#    * #","#  $   #","#####. #","    ####"]},
  {t:4,b:61,r:["     ####","     # @#","     #  #","###### .#","#   $  .#","#  $$# .#","#    ####","###  #","  ####"]},
  {t:4,b:64,r:["########","# @ #  #","#      #","#####$ #","    #  ###"," ## #$ ..#"," ## #  ###","    ####"]},
  {t:4,b:64,r:["######","#  @ #","#  # ##","# .#  ##","# .$$$ #","# .#   #","####   #","   #####"]},
  {t:4,b:71,r:["#######","#     #","#. .  #","# ## ##","#  $ #","###$ #","  #@ #","  #  #","  ####"]},
  {t:4,b:71,r:["      ###","##### #.#","#   ###.#","#   $ #.#","# $  $  #","#####@# #","    #   #","    #####"]},
  {t:4,b:76,r:["  ####","###  #####","#  $  @..#","# $    # #","### #### #","  #      #","  ########"]},
  {t:4,b:77,r:[" ####","##  #","#. $#","#.$ #","#.$ #","#.$ #","#. $##","#   @#","##   #"," #####"]},
  {t:4,b:78,r:["  ######","  #    #","  # ##@##","### # $ #","# ..# $ #","#       #","#  ######","####"]},
  {t:4,b:82,r:["######","# @  #","# $# #","# $  #","# $ ##","### ####"," #  #  #"," #...  #"," #     #"," #######"]},
  {t:4,b:83,r:["  #######","###     #","# $ $   #","# ### #####","# @ . .   #","#   ###   #","##### #####"]},
  {t:4,b:85,r:["#####","#   ####","# # # .#","#    $ ###","### #$.  #","#   #@   #","# # ######","#   #","#####"]},
  {t:4,b:89,r:["      #####","      #.  #","      #.# #","#######.# #","# @ $ $ $ #","# # # # ###","#       #","#########"]},
  {t:4,b:97,r:["  ######","  # ..@#","  # $$ #","  ## ###","   # #","   # #","#### #","#    ##","# #   #","#   # #","###   #","  #####"]},
  {t:4,b:100,r:[" ####"," #  ####"," #     ##","## ##   #","#. .# @$##","#   # $$ #","#  .#    #","##########"]},
  {t:4,b:104,r:["     #####","     #   ##","     #    #"," ######   #","##     #. #","# $ $ @  ##","# ######.#","#        #","##########"]},
  {t:4,b:107,r:["###### #####","#    ###   #","# $$     #@#","# $ #...   #","#   ########","#####"]},
  {t:4,b:156,r:["####","#  ############","# $ $ $ $ $ @ #","# .....       #","###############"]},
  {t:4,b:169,r:[" #########"," #       #","##@##### #","#  #   # #","#  #   $.#","#  ##$##.#","##$##  #.#","#   $  #.#","#   #  ###","########"]},
  {t:4,b:178,r:["############","#          #","# ####### @##","# #         #","# #  $   #  #","# $$ #####  #","###  # # ...#","  #### #    #","       ######"]}
];
const TIERS = ["初学乍练", "渐入佳境", "巧思布局", "连环推演", "大师试炼"];

  const TOP = 56, BOT = 76;

  GB.add({
    id: "sokoban",
    name: "推箱子",
    cat: "puzzle",
    icon: "📦",
    desc: "155 个关卡，把箱子推上目标点",
    tip: "方向键 / WASD 移动 · Z 撤销 · R 重来",
    w: 640, h: 640,
    noScore: true,
    colors: ["#123449", "#08131c"],
    init(api) {
      const ctx = api.ctx;
      const W = api.w, H = api.h;
      let idx = 0, lv = null, boxes = [], pl = null;
      let moves = 0, pushes = 0, hist = [], won = false, panel = false;
      let tile = 40, ox = 0, oy = 0;
      let drag = null, hover = -1;
      let lastCelebrate = 0;
      const particles = [];

      try { idx = (GS.data.sokobanIdx | 0); } catch (e) { idx = 0; }
      if (idx < 0 || idx >= SOKOBAN_LEVELS.length) idx = 0;

      /* ---------- 载入 ---------- */
      function parse(def) {
        const rows = def.r;
        const w = Math.max.apply(null, rows.map((r) => r.length));
        const h = rows.length;
        const walls = new Set(), goals = new Set();
        const bx = [];
        let p = null;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const c = rows[y][x] || " ";
            const i = y * w + x;
            if (c === "#") walls.add(i);
            else if (c === "." || c === "*" || c === "+") goals.add(i);
            if (c === "$" || c === "*") bx.push({ x, y, vx: x, vy: y });
            else if (c === "@" || c === "+") p = { x, y, vx: x, vy: y, dx: 0, dy: 1 };
          }
        }
        return { w, h, walls, goals, boxes: bx, player: p };
      }

      function load(i) {
        idx = Math.max(0, Math.min(SOKOBAN_LEVELS.length - 1, i));
        const def = SOKOBAN_LEVELS[idx];
        lv = parse(def);
        boxes = lv.boxes.map((b) => ({ x: b.x, y: b.y, vx: b.x, vy: b.y }));
        pl = lv.player;
        moves = 0; pushes = 0; hist = []; won = false; panel = false;
        particles.length = 0;
        floorCache.clear();
        GS.data.sokobanIdx = idx;
        GS.save();
        layout();
        api.hint("方向键 / WASD 移动 · Z 撤销 · R 重来 · L 选关");
      }

      function layout() {
        const areaW = W - 36, areaH = H - TOP - BOT;
        tile = Math.floor(Math.min(areaW / lv.w, areaH / lv.h, 74));
        ox = (W - tile * lv.w) / 2;
        oy = TOP + (areaH - tile * lv.h) / 2;
      }

      /* ---------- 操作 ---------- */
      function wall(x, y) {
        if (x < 0 || y < 0 || x >= lv.w || y >= lv.h) return true;
        return lv.walls.has(y * lv.w + x);
      }
      function boxAt(x, y) {
        for (let i = 0; i < boxes.length; i++) if (boxes[i].x === x && boxes[i].y === y) return i;
        return -1;
      }
      function snapshot() {
        hist.push({
          b: boxes.map((b) => (b.x << 5) | b.y),
          p: (pl.x << 5) | pl.y,
          m: moves, u: pushes
        });
        if (hist.length > 600) hist.shift();
      }

      function move(dx, dy) {
        if (won || panel) return;
        pl.dx = dx; pl.dy = dy;
        const nx = pl.x + dx, ny = pl.y + dy;
        if (wall(nx, ny)) { api.beep(90, 0.06, "square", 0.03); return; }
        const bi = boxAt(nx, ny);
        if (bi >= 0) {
          const bx = nx + dx, by = ny + dy;
          if (wall(bx, by) || boxAt(bx, by) >= 0) { api.beep(90, 0.06, "square", 0.03); return; }
          snapshot();
          boxes[bi].x = bx; boxes[bi].y = by;
          pl.x = nx; pl.y = ny;
          moves++; pushes++;
          api.beep(150, 0.07, "triangle", 0.04, 100);
          if (lv.goals.has(by * lv.w + bx)) {
            api.beep(880, 0.09, "sine", 0.05);
            burst(bx, by);
          }
        } else {
          snapshot();
          pl.x = nx; pl.y = ny;
          moves++;
          api.beep(220, 0.03, "sine", 0.02, 190);
        }
        check();
      }

      function burst(bx, by) {
        for (let i = 0; i < 7; i++) {
          particles.push({
            x: ox + (bx + 0.5) * tile, y: oy + (by + 0.5) * tile,
            vx: api.rand(-90, 90), vy: api.rand(-130, -30),
            life: 1, c: Math.random() > 0.5 ? "#ffb347" : "#4fd1c5", r: api.rand(1.5, 3)
          });
        }
      }

      function check() {
        for (const b of boxes) if (!lv.goals.has(b.y * lv.w + b.x)) return;
        won = true;
        completeLevel();
        lastCelebrate = 0;
        for (const b of boxes) burst(b.x, b.y);
        api.beep(660, 0.12, "sine", 0.06, 990);
        setTimeout(() => api.beep(990, 0.2, "sine", 0.06), 120);
      }

      function undo() {
        if (won || !hist.length) return;
        const s = hist.pop();
        s.b.forEach((v, i) => { boxes[i].x = v >> 5; boxes[i].y = v & 31; });
        pl.x = s.p >> 5; pl.y = s.p & 31;
        moves = s.m; pushes = s.u;
        api.beep(320, 0.05, "triangle", 0.035, 260);
      }

      /* ---------- 绘制 ---------- */
      function draw() {
        api.clear("#0a1219");
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#0d1a24"); g.addColorStop(1, "#080f15");
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

        drawTopBar();
        if (lv) {
          drawBoard();
          drawPlayer();
          drawParticles();
        }
        drawBottomBar();
        if (panel) drawPanel();
        if (won) drawWin();
      }

      function drawTopBar() {
        api.text("推箱子", 20, 26, { size: 16, weight: 800, color: "#dbe6f2", align: "left" });
        const tier = TIERS[SOKOBAN_LEVELS[idx].t] || "";
        api.text("第 " + (idx + 1) + " / " + SOKOBAN_LEVELS.length + " 关 · " + tier,
          20, 44, { size: 11, color: "#63788c", align: "left" });
        api.text("步数 " + moves + "   推动 " + pushes, W - 20, 26, { size: 12.5, color: "#9fb2c4", align: "right" });
        const b = SOKOBAN_LEVELS[idx].b;
        api.text("最优 " + (b ? b + " 步" : "—"), W - 20, 44, { size: 11, color: "#c99a4a", align: "right" });
      }

      function drawBoard() {
        const T = tile;
        // 地板
        for (let y = 0; y < lv.h; y++) {
          for (let x = 0; x < lv.w; x++) {
            const i = y * lv.w + x;
            if (lv.walls.has(i)) continue;
            // 只画可达地块（外部留空）
            if (!isFloor(x, y)) continue;
            const px = ox + x * T, py = oy + y * T;
            ctx.fillStyle = (x + y) % 2 ? "#16232e" : "#131e28";
            ctx.fillRect(px, py, T, T);
            ctx.strokeStyle = "rgba(255,255,255,.022)";
            ctx.lineWidth = 1;
            ctx.strokeRect(px + 0.5, py + 0.5, T - 1, T - 1);
            if (lv.walls.has((y - 1) * lv.w + x)) {
              const sg = ctx.createLinearGradient(0, py, 0, py + T * 0.4);
              sg.addColorStop(0, "rgba(0,0,0,.3)"); sg.addColorStop(1, "rgba(0,0,0,0)");
              ctx.fillStyle = sg; ctx.fillRect(px, py, T, T * 0.4);
            }
          }
        }
        // 目标
        for (const i of lv.goals) {
          const x = i % lv.w, y = (i - x) / lv.w;
          if (!isFloor(x, y)) continue;
          const cx = ox + (x + 0.5) * T, cy = oy + (y + 0.5) * T;
          const pulse = 0.5 + 0.5 * Math.sin(api.t * 2 + x + y);
          ctx.beginPath();
          ctx.arc(cx, cy, T * 0.2, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,179,71," + (0.35 + pulse * 0.3) + ")";
          ctx.lineWidth = Math.max(1.4, T * 0.045);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, T * 0.065, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,200,120," + (0.5 + pulse * 0.3) + ")";
          ctx.fill();
        }
        // 墙
        for (const i of lv.walls) {
          const x = i % lv.w, y = (i - x) / lv.w;
          const px = ox + x * T, py = oy + y * T;
          api.rr(px + 1, py + 1, T - 2, T - 2, Math.min(5, T * 0.16));
          const wg = ctx.createLinearGradient(0, py, 0, py + T);
          wg.addColorStop(0, "#31465a"); wg.addColorStop(0.6, "#263848"); wg.addColorStop(1, "#1b2833");
          ctx.fillStyle = wg; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.07)";
          ctx.lineWidth = 1; ctx.stroke();
        }
        // 箱子
        for (const b of boxes) {
          const px = ox + b.vx * T;
          const py = oy + b.vy * T;
          drawBox(px, py, b);
        }
      }

      const floorCache = new Set();
      function isFloor(x, y) {
        if (lv.walls.has(y * lv.w + x)) return false;
        if (floorCache.has(y * lv.w + x)) return true;
        // 从玩家出发的连通区域（可穿箱子）
        if (floorCache.size === 0) {
          const st = [pl.y * lv.w + pl.x];
          floorCache.add(st[0]);
          while (st.length) {
            const i = st.pop(), cx = i % lv.w, cy = (i - cx) / lv.w;
            const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const n of nb) {
              if (n[0] < 0 || n[1] < 0 || n[0] >= lv.w || n[1] >= lv.h) continue;
              const j = n[1] * lv.w + n[0];
              if (lv.walls.has(j) || floorCache.has(j)) continue;
              floorCache.add(j); st.push(j);
            }
          }
        }
        return floorCache.has(y * lv.w + x);
      }

      function drawBox(px, py) {
        const T = tile, m = T * 0.09;
        const x = px + m, y = py + m, s = T - m * 2, r = Math.max(2.5, T * 0.14);
        const bx = Math.round((px - ox) / T), by = Math.round((py - oy) / T);
        const on = lv.goals.has(by * lv.w + bx);

        ctx.save();
        ctx.globalAlpha = 0.32; ctx.fillStyle = "#000";
        api.rr(x + T * 0.03, y + T * 0.07, s, s, r); ctx.fill();
        ctx.restore();

        const bg = ctx.createLinearGradient(x, y, x, y + s);
        if (on) { bg.addColorStop(0, "#ffd98a"); bg.addColorStop(0.55, "#f2ac45"); bg.addColorStop(1, "#d0801f"); }
        else { bg.addColorStop(0, "#d99b66"); bg.addColorStop(0.55, "#bd7a44"); bg.addColorStop(1, "#8f5a2c"); }
        api.rr(x, y, s, s, r);
        ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = on ? "rgba(120,66,10,.85)" : "rgba(66,38,16,.85)";
        ctx.lineWidth = Math.max(1.2, T * 0.035); ctx.stroke();

        ctx.save();
        api.rr(x, y, s, s, r); ctx.clip();
        ctx.strokeStyle = on ? "rgba(140,80,16,.4)" : "rgba(70,40,18,.4)";
        ctx.lineWidth = Math.max(1.3, T * 0.05);
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + s, y + s);
        ctx.moveTo(x + s, y); ctx.lineTo(x, y + s);
        ctx.stroke();
        ctx.beginPath();
        api.rr(x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, r * 0.5);
        ctx.strokeStyle = on ? "rgba(255,255,255,.28)" : "rgba(255,235,210,.15)";
        ctx.lineWidth = Math.max(1, T * 0.028); ctx.stroke();
        const hg = ctx.createLinearGradient(0, y, 0, y + s * 0.5);
        hg.addColorStop(0, "rgba(255,255,255,.22)"); hg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hg; ctx.fillRect(x, y, s, s * 0.5);
        ctx.restore();

        if (on) {
          ctx.save();
          ctx.globalAlpha = 0.3 + 0.2 * Math.sin(api.t * 3);
          ctx.strokeStyle = "#ffd479"; ctx.lineWidth = Math.max(1, T * 0.03);
          api.rr(x - T * 0.04, y - T * 0.04, s + T * 0.08, s + T * 0.08, r + 2);
          ctx.stroke(); ctx.restore();
        }
      }

      function drawPlayer() {
        const T = tile;
        const cx = ox + (pl.vx + 0.5) * T, py = oy + pl.vy * T;
        const breathe = Math.sin(api.t * 4) * T * 0.012;
        ctx.save();
        ctx.globalAlpha = 0.33; ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(cx, py + T * 0.86, T * 0.24, T * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        const bw = T * 0.42, bh = T * 0.34;
        const bx = cx - bw / 2, by = py + T * 0.48 + breathe;
        const bg = ctx.createLinearGradient(0, by, 0, by + bh);
        bg.addColorStop(0, "#63e6d9"); bg.addColorStop(1, "#2aa79c");
        api.rr(bx, by, bw, bh, bw * 0.36);
        ctx.fillStyle = bg; ctx.fill();
        ctx.strokeStyle = "rgba(4,50,46,.5)"; ctx.lineWidth = Math.max(1, T * 0.022); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.16)";
        api.rr(bx + bw * 0.2, by + bh * 0.16, bw * 0.22, bh * 0.48, bw * 0.11); ctx.fill();

        const hr = T * 0.185, hy = by - hr * 0.7;
        const hg = ctx.createRadialGradient(cx - hr * 0.3, hy - hr * 0.4, hr * 0.1, cx, hy, hr * 1.1);
        hg.addColorStop(0, "#c7fff8"); hg.addColorStop(0.55, "#6ee7db"); hg.addColorStop(1, "#35b0a4");
        ctx.beginPath(); ctx.arc(cx, hy, hr, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
        ctx.strokeStyle = "rgba(4,50,46,.45)"; ctx.lineWidth = Math.max(1, T * 0.02); ctx.stroke();

        const ex = pl.dx * hr * 0.28, ey = pl.dy * hr * 0.22, er = Math.max(1.2, T * 0.036);
        ctx.fillStyle = "#07302c";
        ctx.beginPath(); ctx.arc(cx - hr * 0.3 + ex, hy + ey, er, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + hr * 0.3 + ex, hy + ey, er, 0, Math.PI * 2); ctx.fill();
      }

      function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
          const q = particles[i];
          ctx.globalAlpha = Math.max(0, q.life);
          ctx.fillStyle = q.c;
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r * q.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      function btnRects() {
        const pad = 16, gap = 8;
        const w = (W - pad * 2 - gap * 2) / 3, h = 42, y = H - BOT + 16;
        return [
          { x: pad, y, w, h, t: "撤销", k: "undo" },
          { x: pad + w + gap, y, w, h, t: "重来", k: "restart" },
          { x: pad + (w + gap) * 2, y, w, h, t: "选关", k: "levels" }
        ];
      }

      function drawBottomBar() {
        const rects = btnRects();
        for (const r of rects) {
          const active = hover === r.k;
          api.rr(r.x, r.y, r.w, r.h, 11);
          ctx.fillStyle = active ? "rgba(124,92,255,.3)" : "rgba(255,255,255,.055)";
          ctx.fill();
          ctx.strokeStyle = active ? "rgba(160,140,255,.7)" : "rgba(255,255,255,.1)";
          ctx.lineWidth = 1; ctx.stroke();
          api.text(r.t, r.x + r.w / 2, r.y + r.h / 2 + 1, { size: 13, weight: 600, color: active ? "#fff" : "#b9c6d6" });
        }
      }

      const PANEL_COLS = 10, PANEL_ROWS = 5, PER_PAGE = PANEL_COLS * PANEL_ROWS;
      let panelPage = 0;

      function pagerRects() {
        const y = 402, w = 96, h = 34, gap = 148;
        return {
          prev: { x: W / 2 - gap - w / 2, y, w, h },
          next: { x: W / 2 + gap - w / 2, y, w, h }
        };
      }

      function drawPanel() {
        ctx.fillStyle = "rgba(6,10,16,.86)";
        ctx.fillRect(0, 0, W, H);
        api.text("选择关卡", W / 2, 48, { size: 18, weight: 800, color: "#e8eef6" });
        api.text("已完成 " + (GS.data.sokobanDone ? Object.keys(GS.data.sokobanDone).length : 0) + " / " + SOKOBAN_LEVELS.length,
          W / 2, 70, { size: 11, color: "#6f8296" });

        const cols = PANEL_COLS, cell = 42, gap = 7;
        const gridW = cols * cell + (cols - 1) * gap;
        const x0 = (W - gridW) / 2;
        const y0 = 90;
        const start = panelPage * PER_PAGE;
        for (let k = 0; k < PER_PAGE; k++) {
          const i = start + k;
          if (i >= SOKOBAN_LEVELS.length) break;
          const r = Math.floor(k / cols), c = k % cols;
          const x = x0 + c * (cell + gap), y = y0 + r * (cell + gap + 6);
          const done = GS.data.sokobanDone && GS.data.sokobanDone[i];
          api.rr(x, y, cell, cell, 9);
          ctx.fillStyle = i === idx ? "rgba(251,191,36,.18)" : done ? "rgba(79,209,197,.14)" : "rgba(255,255,255,.05)";
          ctx.fill();
          ctx.strokeStyle = i === idx ? "#fbbf24" : done ? "rgba(79,209,197,.4)" : "rgba(255,255,255,.09)";
          ctx.lineWidth = i === idx ? 1.6 : 1;
          ctx.stroke();
          api.text(String(i + 1), x + cell / 2, y + cell / 2, {
            size: 12.5, weight: 700,
            color: i === idx ? "#fbbf24" : done ? "#7fe3d8" : "#93a3b6"
          });
        }

        const pages = Math.max(1, Math.ceil(SOKOBAN_LEVELS.length / PER_PAGE));
        const pr = pagerRects();
        const drawPg = (r, label, enabled) => {
          api.rr(r.x, r.y, r.w, r.h, 10);
          ctx.fillStyle = enabled ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.03)";
          ctx.fill();
          ctx.strokeStyle = enabled ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)";
          ctx.lineWidth = 1; ctx.stroke();
          api.text(label, r.x + r.w / 2, r.y + r.h / 2 + 1, {
            size: 12, weight: 600, color: enabled ? "#c8d5e4" : "#4d5b6c"
          });
        };
        drawPg(pr.prev, "‹ 上一页", panelPage > 0);
        drawPg(pr.next, "下一页 ›", panelPage < pages - 1);
        api.text((panelPage + 1) + " / " + pages, W / 2, pr.prev.y + pr.prev.h / 2 + 1,
          { size: 12, weight: 700, color: "#9fb2c4" });

        api.text("点击关卡开始 · 点击空白处返回", W / 2, pr.prev.y + pr.prev.h + 20, { size: 11, color: "#5d6e82" });
        panelCloseY = pr.prev.y + pr.prev.h + 8;
      }
      let panelCloseY = 0;

      function openPanel() {
        panelPage = Math.floor(idx / PER_PAGE);
        panel = true;
      }

      function drawWin() {
        ctx.fillStyle = "rgba(5,10,14,.8)";
        ctx.fillRect(0, 0, W, H);
        const pw = Math.min(W * 0.8, 330), ph = 230;
        const px = (W - pw) / 2, py = (H - ph) / 2;
        api.rr(px, py, pw, ph, 20);
        ctx.fillStyle = "#132029"; ctx.fill();
        ctx.strokeStyle = "rgba(79,209,197,.4)"; ctx.lineWidth = 1.5; ctx.stroke();
        api.text("过关！", W / 2, py + 56, { size: 26, weight: 800, color: "#6ee7d8" });
        api.text("第 " + (idx + 1) + " 关 · " + moves + " 步 / " + pushes + " 次推动", W / 2, py + 88, { size: 12, color: "#8fa3b6" });
        const best = SOKOBAN_LEVELS[idx].b;
        if (best) {
          const stars = moves <= best ? 3 : moves <= Math.ceil(best * 1.35) + 6 ? 2 : 1;
          api.text("★".repeat(stars) + "☆".repeat(3 - stars), W / 2, py + 122, { size: 20, color: "#fbbf24" });
        }
        const last = idx >= SOKOBAN_LEVELS.length - 1;
        const bw = 160, bh = 42, bx = (W - bw) / 2, by = py + ph - 58;
        api.rr(bx, by, bw, bh, 12);
        const g2 = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
        g2.addColorStop(0, "#53dccf"); g2.addColorStop(1, "#2ba79c");
        ctx.fillStyle = g2; ctx.fill();
        api.text(last ? "回到选关" : "下一关", W / 2, by + bh / 2 + 1, { size: 14, weight: 700, color: "#04211f" });
        winBtn = { x: bx, y: by, w: bw, h: bh };
      }
      let winBtn = null;

      /* ---------- 交互 ---------- */
      function hitBtn(p) {
        for (const r of btnRects()) {
          if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return r.k;
        }
        return null;
      }

      function completeLevel() {
        GS.data.sokobanDone = GS.data.sokobanDone || {};
        GS.data.sokobanDone[idx] = GS.data.sokobanDone[idx] || { m: moves };
        GS.save();
      }

      api.onKey((k) => {
        if (panel) {
          const pages = Math.max(1, Math.ceil(SOKOBAN_LEVELS.length / PER_PAGE));
          if (k === "Escape" || k === "l" || k === "L") panel = false;
          else if (k === "ArrowLeft") panelPage = Math.max(0, panelPage - 1);
          else if (k === "ArrowRight") panelPage = Math.min(pages - 1, panelPage + 1);
          return;
        }
        if (won) {
          if (k === "Enter" || k === " " || k === "n") nextLevel();
          if (k === "r" || k === "R") load(idx);
          return;
        }
        const map = {
          ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
          w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
        };
        if (map[k]) { move(map[k][0], map[k][1]); return; }
        if (k === "z" || k === "Z") undo();
        else if (k === "r" || k === "R") load(idx);
        else if (k === "l" || k === "L") { if (panel) panel = false; else openPanel(); }
      });

      api.onDown((p) => {
        if (panel) {
          const cols = PANEL_COLS, cell = 42, gap = 7;
          const gridW = cols * cell + (cols - 1) * gap;
          const x0 = (W - gridW) / 2, y0 = 90;
          const pr = pagerRects();
          const inRect = (r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
          const pages = Math.max(1, Math.ceil(SOKOBAN_LEVELS.length / PER_PAGE));
          if (inRect(pr.prev)) { if (panelPage > 0) panelPage--; return; }
          if (inRect(pr.next)) { if (panelPage < pages - 1) panelPage++; return; }
          const c = Math.floor((p.x - x0) / (cell + gap));
          const r = Math.floor((p.y - y0) / (cell + gap + 6));
          if (c >= 0 && c < cols && r >= 0 && r < PANEL_ROWS) {
            const i = panelPage * PER_PAGE + r * cols + c;
            if (i < SOKOBAN_LEVELS.length) { panel = false; load(i); return; }
          }
          if (p.y > panelCloseY) panel = false;
          return;
        }
        if (won) {
          if (winBtn && p.x >= winBtn.x && p.x <= winBtn.x + winBtn.w && p.y >= winBtn.y && p.y <= winBtn.y + winBtn.h) {
            nextLevel();
          }
          return;
        }
        const k = hitBtn(p);
        if (k === "undo") { undo(); return; }
        if (k === "restart") { load(idx); return; }
        if (k === "levels") { openPanel(); return; }
        drag = { x: p.x, y: p.y };
      });

      api.onMove((p) => {
        if (!drag) return;
        const th = Math.max(16, tile * 0.55);
        const dx = p.x - drag.x, dy = p.y - drag.y;
        if (Math.abs(dx) < th && Math.abs(dy) < th) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          move(Math.sign(dx), 0);
          drag.x += Math.sign(dx) * th; drag.y = p.y;
        } else {
          move(0, Math.sign(dy));
          drag.y += Math.sign(dy) * th; drag.x = p.x;
        }
      });
      api.onUp(() => { drag = null; });

      function nextLevel() {
        completeLevel();
        if (idx < SOKOBAN_LEVELS.length - 1) load(idx + 1);
        else { won = false; openPanel(); }
      }

      /* ---------- 主循环 ---------- */
      load(idx);

      api.loop((dt) => {
        // 平滑动画
        const k = Math.min(1, dt * 16);
        for (const b of boxes) {
          b.vx += (b.x - b.vx) * k;
          b.vy += (b.y - b.vy) * k;
        }
        pl.vx += (pl.x - pl.vx) * k;
        pl.vy += (pl.y - pl.vy) * k;
        for (let i = particles.length - 1; i >= 0; i--) {
          const q = particles[i];
          q.life -= dt * 0.9;
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 460 * dt;
          if (q.life <= 0) particles.splice(i, 1);
        }
        draw();
      });
    }
  });
})();
