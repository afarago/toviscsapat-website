"e:\wutil\ImageMagick-7.1.1-27-portable-Q16-HDRI-x64\magick.exe" mogrify -format jpg -path tn -thumbnail "255x255>" "%1" "tn\%1"
move "tn\%~n1.jpg" "tn\%~n1_tn.jpg"
