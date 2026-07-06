#!/usr/bin/env python3
import os
import sys
import json
import time
import urllib.request
import urllib.parse
import re
import random

# 기본 설정 정보
BASE_URL = "https://pawinhand.net/bridge"
# 데이터를 저장할 폴더 경로 (backend/data)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def map_shelter_id(city, address):
    """주소 또는 도시명을 기반으로 프론트엔드의 고정 보호소 ID (shelter-1 ~ shelter-12)와 연결해 줍니다.
    이를 통해 지도의 마커 필터와 상세 보기 동물 조회가 유기적으로 연결됩니다."""
    city_str = city or address or ""
    if "서울" in city_str or "마포" in city_str:
        # 서울 마포구 유기동물보호소(shelter-1)와 한국동물구조관리협회 (서울)(shelter-4)에 분산 매핑
        return random.choice(["shelter-1", "shelter-4"])
    elif "수원" in city_str or "경기" in city_str or "가평" in city_str or "양평" in city_str or "남양주" in city_str:
        # 수원 유기동물 입양센터
        return "shelter-2"
    elif "인천" in city_str:
        # 인천 연수구 동물보호센터
        return "shelter-3"
    elif "부산" in city_str:
        # 부산 해운대구 유기동물 보호센터
        return "shelter-5"
    elif "대구" in city_str:
        # 대구 달서구 동물보호협회
        return "shelter-6"
    elif "경남" in city_str or "경상남도" in city_str or "창원" in city_str or "밀양" in city_str or "사천" in city_str or "진주" in city_str:
        # 창원시 유기동물 종합 보호소
        return "shelter-7"
    elif "광주" in city_str or "전남" in city_str or "전라남도" in city_str:
        # 광주 동물보호센터
        return "shelter-8"
    elif "천안" in city_str or "충남" in city_str or "충청남도" in city_str or "충북" in city_str or "충청북도" in city_str or "대전" in city_str or "세종" in city_str:
        # 천안 유기동물 보호소
        return "shelter-9"
    elif "전북" in city_str or "전라북도" in city_str or "군산" in city_str:
        # 전주 유기동물 보호센터 (전북 대표)
        return "shelter-10"
    elif "경북" in city_str or "경상북도" in city_str or "구미" in city_str or "상주" in city_str or "영양" in city_str:
        # 구미 동물사랑 보호소
        return "shelter-11"
    elif "강원" in city_str or "강원특별자치도" in city_str or "춘천" in city_str or "강릉" in city_str or "삼척" in city_str or "원주" in city_str:
        # 춘천시 유기동물 보호센터
        return "shelter-12"
    elif "제주" in city_str or "제주특별자치도" in city_str:
        # 제주특별자치도 동물보호센터
        return "shelter-13"
    else:
        # 매칭되지 않을 경우 기본값 서울보호소
        return "shelter-1"

def make_request(url):
    """HTTP GET 요청을 보내고 결과를 JSON 형식으로 분석하여 반환합니다. 실패 시 None을 돌려줍니다."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"요청 실패 ({url}): {e}", file=sys.stderr)
        return None

def clean_breed(breed_str):
    """품종명에 불필요하게 섞여 있는 '[개] ', '[고양이] ' 등의 문자열을 제거합니다."""
    if not breed_str:
        return "믹스견"
    return re.sub(r"^\[.*?\]\s*", "", breed_str).strip()

def clean_weight(weight_str):
    """'0.6(Kg)', '2.5(kg)'와 같은 무게 표현 문자열에서 숫자 부분만 실수형(float)으로 정제합니다."""
    if not weight_str:
        return 0.0
    match = re.search(r"([0-9.]+)", str(weight_str))
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 0.0

def determine_size(weight, comment=""):
    """몸무게 값을 바탕으로 소형/중형/대형 견종 분류를 산출합니다.
    단, 아기 강아지인 경우 본문에 언급된 성견 예상 몸무게를 파싱하여 반영합니다."""
    comment_clean = str(comment).replace(" ", "")
    if "성견" in comment_clean or "예상" in comment_clean:
        import re
        # '10키로', '12킬로', '15kg' 등 숫자와 함께 몸무게 표기 추출
        weights = [float(x) for x in re.findall(r"([0-9.]+)(?:키로|킬로|kg)", comment_clean.lower())]
        if weights:
            max_est_weight = max(weights)
            if max_est_weight > weight:
                weight = max_est_weight

    if weight <= 7.0:
        return "소형"
    elif weight <= 15.0:
        return "중형"
    else:
        return "대형"

def format_date(date_str):
    """YYYYMMDD 형식의 날짜 문자열을 YYYY-MM-DD 형태로 변환합니다."""
    if not date_str or len(str(date_str)) != 8:
        return date_str
    s = str(date_str)
    return f"{s[:4]}-{s[4:6]}-{s[6:]}"

def crawl():
    print("포인핸드 유기동물 데이터 수집을 시작합니다...")
    
    # 데이터를 담을 저장 폴더가 없으면 자동으로 생성합니다 (exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # 1. 목록 조회 API 호출 설정 (시연 중 지도가 꽉 찰 수 있도록 120마리 기준 설정)
    limit = 120
    params = {
        "shelter_name": "",
        "city": "모든 지역",
        "country": "전체",
        "species": "모든 동물",
        "breeds": "전체",
        "offset": 0,
        "limit": limit
    }
    query_str = urllib.parse.urlencode(params)
    list_url = f"{BASE_URL}/shelter/animal/recommended/condition?{query_str}"
    
    print(f"수집할 동물 목록 조회 중: {list_url}")
    animals_raw = make_request(list_url)
    
    if not animals_raw or not isinstance(animals_raw, list):
        print("동물 목록을 가져오지 못했거나 올바르지 않은 응답 형식입니다.", file=sys.stderr)
        return
        
    print(f"목록에서 {len(animals_raw)}마리의 유기동물을 발견했습니다. 개별 상세 분석 및 수집을 진행합니다...")
    
    animals_db = []
    
    for idx, item in enumerate(animals_raw):
        notify_no = item.get("notify_number")
        if not notify_no:
            continue
            
        # 서버에 부담을 주지 않기 위해 매 요청마다 짧은 시간(0.2초) 정지합니다
        time.sleep(0.2)
        
        # 2. 개별 유기동물 상세 스키마 조회 API 호출
        encoded_notify = urllib.parse.quote(notify_no)
        detail_url = f"{BASE_URL}/animal/{encoded_notify}"
        detail_raw = make_request(detail_url) or {}
        
        # 공고 상태(state) 필터링: 입양 대기 중(보호중, 공고중)이 아닌 경우 크롤링 대상에서 제외
        state = item.get("state") or detail_raw.get("state")
        if state not in ["보호중", "공고중"]:
            print(f"[{idx+1}/{len(animals_raw)}] {notify_no} 건은 입양 대기(보호중/공고중) 상태가 아니므로 건너뜁니다 (상태: {state})")
            continue
            
        print(f"[{idx+1}/{len(animals_raw)}] {notify_no} 수집 중 (상태: {state})...")
        
        # 3. 개별 유기동물 태그 목록 조회 API 호출
        tags_url = f"{BASE_URL}/animal/tag/{encoded_notify}"
        tags_raw = make_request(tags_url)
        tags = []
        if tags_raw and isinstance(tags_raw, list):
            # 이모지가 포함된 태그 명칭을 그대로 배열에 수집 (UI 렌더링 시 심미적 효과 확보)
            tags = [t.get("tag_name", "").strip() for t in tags_raw if t.get("tag_name")]
            
        # 4. 개별 유기동물 댓글 조회 API 호출 (최대 50개 제한)
        comments_url = f"{BASE_URL}/comments/abandon?notifynumber={encoded_notify}&offset=0&limit=50"
        comments_raw = make_request(comments_url)
        comments = []
        if comments_raw and isinstance(comments_raw, list):
            for c in comments_raw:
                comments.append({
                    "user_id": c.get("user_id", "익명"),
                    "content": c.get("content", ""),
                    "update_time": c.get("update_time", "")
                })
        
        # 이름 보정 (이름이 없는 경우 '없음. 지어주세요!'로 설정)
        name = item.get("animal_name") or detail_raw.get("animal_name")
        if not name or name.strip() == "":
            name = "없음. 지어주세요!"
            
        # 이미지 데이터 수집
        photos = []
        # 메인 사진 등록
        main_img = item.get("animal_image") or detail_raw.get("image") or detail_raw.get("image2")
        if main_img:
            photos.append(main_img)
            
        # 상세 페이지의 추가적인 다중 이미지들 등록
        for key in ["more_image1", "more_image2", "more_image3", "more_image4"]:
            img_path = item.get(key) or detail_raw.get(key)
            if img_path:
                if img_path.startswith("http"):
                    photos.append(img_path)
                else:
                    # 상대 경로일 때 정적 이미지 호스트 주소를 접두어로 부여
                    photos.append(f"https://d12l2mexpetzlh.cloudfront.net/images/shelter/{img_path}")
        
        # 이미지 주소 중복 제거 (수집 순서 보존)
        photos = list(dict.fromkeys(photos))
        
        # 몸무게 추출 및 정밀 크기 등급 판정
        raw_weight = item.get("animal_weight") or detail_raw.get("weight")
        weight_num = clean_weight(raw_weight)
        comment = item.get("personality_comment") or detail_raw.get("personality_comment") or ""
        size_class = determine_size(weight_num, comment)
        
        # 성별 문자 필드 매핑
        raw_sex = item.get("animal_sex") or detail_raw.get("sex")
        sex = "미상"
        if raw_sex == "F":
            sex = "암컷"
        elif raw_sex == "M":
            sex = "수컷"
            
        # 중성화 상태 필드 매핑
        raw_neutral = item.get("animal_neutral") or detail_raw.get("neutral")
        neutered = "알 수 없음"
        if raw_neutral == "Y":
            neutered = "예"
        elif raw_neutral == "N":
            neutered = "아니오"
            
        # 활동량, 성격 등 척도화 수치 정수 형변환 함수
        def parse_scale(val, default=3):
            if val is None:
                return default
            try:
                return int(val)
            except ValueError:
                return default
                
        health_state = parse_scale(item.get("health_state") or detail_raw.get("health_state"), 4)
        activity = parse_scale(item.get("activity") or detail_raw.get("activity"), 3)
        aggression = parse_scale(item.get("aggression") or detail_raw.get("aggression"), 5)  # 포인핸드 상 5는 순하고 양호함 의미
        sociability = parse_scale(item.get("sociability") or detail_raw.get("sociability"), 4)
        
        # 입양 지원금 정보 파싱
        raw_support = item.get("adoption_support") or detail_raw.get("adoption_support")
        adoption_support = True if raw_support in ["YES", "Y", "yes"] else False
        adoption_support_detail = item.get("adoption_support_detail") or detail_raw.get("adoption_support_detail") or ""
        
        # 신규 필드 수집: city 및 bell_count
        city = item.get("city") or detail_raw.get("city") or "기타"
        bell_count = parse_scale(item.get("bell_count") or detail_raw.get("bell_count"), 0)
        
        # 보호소 ID 매핑 (프론트엔드의 고정 보호소 12개 중 매치되는 곳 연결)
        shelter_address = item.get("shelter_address") or detail_raw.get("shelter_address") or ""
        shelter_id = map_shelter_id(city, shelter_address)
        
        # AGENTS.md에서 약속한 데이터 구조에 맞춰 최종 동물 오브젝트 생성
        animal_record = {
            "id": notify_no,
            "name": name,
            "photos": photos,
            "species": item.get("species") or detail_raw.get("species") or "기타",
            "breeds": clean_breed(item.get("s_breeds") or item.get("breeds") or detail_raw.get("s_breeds")),
            "animal_age": item.get("animal_age") or detail_raw.get("animal_age") or "나이 미상",
            "animal_sex": sex,
            "animal_weight": weight_num,
            "size": size_class,
            "neutered": neutered,
            "health_state": health_state,
            "activity": activity,
            "aggression": aggression,
            "sociability": sociability,
            "personality_comment": item.get("personality_comment") or detail_raw.get("personality_comment") or "공고된 정보가 아직 업데이트되지 않았습니다.",
            "tags": tags,
            "notice_no": notify_no,
            "notice_start": format_date(item.get("notify_sdt") or detail_raw.get("notify_sdt")),
            "notice_end": format_date(item.get("notify_edt") or detail_raw.get("notify_edt")),
            "found_location": item.get("find_location") or detail_raw.get("find_location") or "정보 없음",
            "shelter_id": shelter_id,
            "adoption_support": adoption_support,
            "adoption_support_detail": adoption_support_detail,
            "city": city,
            "bell_count": bell_count,
            "comments": comments
        }
        
        animals_db.append(animal_record)

    # 수집 완료 후 다중 경로 저장 (백엔드, 루트 데이터, 프론트엔드 JSON/JS 동시 최신화)
    # 1. backend/data/animals.json 저장
    os.makedirs(DATA_DIR, exist_ok=True)
    backend_path = os.path.join(DATA_DIR, "animals.json")
    with open(backend_path, "w", encoding="utf-8") as f:
        json.dump(animals_db, f, ensure_ascii=False, indent=2)
    print(f"- 백엔드 JSON 저장 완료: {backend_path}")

    # 2. root data/animals.json 저장
    root_data_dir = os.path.join(os.path.dirname(os.path.dirname(DATA_DIR)), "data")
    os.makedirs(root_data_dir, exist_ok=True)
    root_json_path = os.path.join(root_data_dir, "animals.json")
    with open(root_json_path, "w", encoding="utf-8") as f:
        json.dump(animals_db, f, ensure_ascii=False, indent=2)
    print(f"- 루트 JSON 저장 완료: {root_json_path}")

    # 3. frontend/app/data/animals.json 저장
    frontend_data_dir = os.path.join(os.path.dirname(os.path.dirname(DATA_DIR)), "frontend", "app", "data")
    os.makedirs(frontend_data_dir, exist_ok=True)
    frontend_json_path = os.path.join(frontend_data_dir, "animals.json")
    with open(frontend_json_path, "w", encoding="utf-8") as f:
        json.dump(animals_db, f, ensure_ascii=False, indent=2)
    print(f"- 프론트엔드 JSON 저장 완료: {frontend_json_path}")

    # 4. frontend/app/data/animals.js (JS 모듈 형식) 저장
    frontend_js_path = os.path.join(frontend_data_dir, "animals.js")
    with open(frontend_js_path, "w", encoding="utf-8") as f:
        f.write("export const animals = ")
        json.dump(animals_db, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"- 프론트엔드 JS 모듈 저장 완료: {frontend_js_path}")

    print(f"성공적으로 데이터가 수집 및 4개 경로에 일체 저장되었습니다! (총 {len(animals_db)}마리)")

if __name__ == "__main__":
    crawl()
